import Base from "./Base.controller";
import type View from "sap/ui/core/mvc/View";
import type Table from "sap/ui/table/Table";
import type DynamicPage from "sap/f/DynamicPage";
import type SmartVariantManagement from "sap/ui/comp/smartvariants/SmartVariantManagement";
import type Label from "sap/m/Label";
import FilterBar, { type FilterBar$FilterChangeEvent } from "sap/ui/comp/filterbar/FilterBar";
import type Router from "sap/ui/core/routing/Router";
import type { FilterPayload } from "base/types/filter";
import FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";
import type Input from "sap/m/Input";
import type TextArea from "sap/m/TextArea";
import type MultiInput from "sap/m/MultiInput";
import type DatePicker from "sap/m/DatePicker";
import type TimePicker from "sap/m/TimePicker";
import type MultiComboBox from "sap/m/MultiComboBox";
import type Select from "sap/m/Select";
import type ComboBox from "sap/m/ComboBox";
import type CheckBox from "sap/m/CheckBox";
import type Switch from "sap/m/Switch";
import Token from "sap/m/Token";
import PersonalizableInfo from "sap/ui/comp/smartvariants/PersonalizableInfo";
import { noop } from "base/utils/shared";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { Dict } from "base/types/utils";
import type ODataModel from "sap/ui/model/odata/v2/ODataModel";
import type { ODataError, ODataResponse } from "base/types/odata";
import type { FieldValueHelpItem, LeaveRequestForm, LeaveRequestItem } from "base/types/pages/main";
import { ValueState } from "sap/ui/core/library";
import type Dialog from "sap/m/Dialog";
import Spreadsheet from "sap/ui/export/Spreadsheet";
import type { Dialog$AfterCloseEvent } from "sap/m/Dialog";
import type { Button$PressEvent } from "sap/m/Button";
import MessageToast from "sap/m/MessageToast";
import type { RadioButtonGroup$SelectEvent } from "sap/m/RadioButtonGroup";
import type Context from "sap/ui/model/Context";
import MessageBox from "sap/m/MessageBox";
import type { Route$MatchedEvent } from "sap/ui/core/routing/Route";
import type InputBase from "sap/m/InputBase";
import Event from "sap/ui/base/Event";
import MessagePopover from "sap/m/MessagePopover";
import MessageItem from "sap/m/MessageItem";
import type Button from "sap/m/Button";
import ElementRegistry from "sap/ui/core/ElementRegistry";
import Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import Messaging from "sap/ui/core/Messaging";
import DateTime from "base/utils/DateTime";

/**
 * @namespace base.controller
 */
export default class Main extends Base {
  private model: JSONModel;

  private router: Router;
  private view: View;
  private table: Table;
  private layout: DynamicPage;

  //Filter
  private svm: SmartVariantManagement;
  private expandedLabel: Label;
  private snappedLabel: Label;
  private filterBar: FilterBar;

  //Dialog
  private addDialog: Dialog;
  private editDialog: Dialog;

  //validate
  private messagePopover: MessagePopover;
  private buttonMessagePop: Button;
  private messageManager: Messaging;

  public override onInit(): void {
    this.view = <View>this.getView();
    this.router = this.getRouter();
    this.table = this.getControlById<Table>("table");
    this.layout = this.getControlById<DynamicPage>("dynamicPage");

    this.setModel(
      new JSONModel({
        rows: [],
        selectedIndices: [],
      }),
      "table"
    );

    this.setModel(
      new JSONModel({
        leaveType: [],
        status: [],
        timeSlot: [],
      }),
      "master"
    );

    //filter
    this.svm = this.getControlById<SmartVariantManagement>("svm");
    this.expandedLabel = this.getControlById<Label>("expandedLabel");
    this.snappedLabel = this.getControlById<Label>("snappedLabel");
    this.filterBar = this.getControlById("filterBar");

    // Khởi tạo message manager
    this.messageManager = Messaging;
    this.messageManager.removeAllMessages();

    // Model message
    this.getView()?.setModel(this.messageManager.getMessageModel(), "message");

    //filter initialize
    this.filterBar.registerFetchData(this.fetchData);
    this.filterBar.registerApplyData(this.applyData);
    this.filterBar.registerGetFiltersWithValues(this.getFiltersWithValues);

    this.svm.addPersonalizableControl(
      new PersonalizableInfo({
        type: "filterBar",
        keyName: "table",
        dataSource: "",
        control: this.filterBar,
      })
    );
    this.svm.initialise(noop, this.filterBar);

    // Router
    this.router.getRoute("RouteMain")?.attachMatched(this.onObjectMatched);
  }

  // #region Lifecycle hook
  public override onAfterRendering(): void | undefined {}

  public override onExit(): void | undefined {
    this.router.getRoute("RouteMain")?.detachMatched(this.onObjectMatched);
  }
  // #endregion Lifecycle hook

  // #region Router
  private onObjectMatched = (event: Route$MatchedEvent) => {
    this.getMetadataLoaded()
      .then(() => this.onGetMasterData())
      .then(() => {
        this.filterBar.fireSearch();
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        // loading off
      });
  };
  // #endregion Router

  // #region Filters
  /**
   * Lấy các trường giá trị để tạo biến thể bộ lọc mới
   */
  private fetchData = () => {
    return this.filterBar.getAllFilterItems(false).reduce<FilterPayload[]>((acc, item: FilterGroupItem) => {
      const control = item.getControl();
      const groupName = item.getGroupName();
      const fieldName = item.getName();
      if (control) {
        let fieldData: string | string[] = "";

        switch (true) {
          case this.isControl<Input>(control, "sap.m.Input"): {
            fieldData = control.getValue();
            break;
          }

          case this.isControl<TextArea>(control, "sap.m.TextArea"): {
            fieldData = control.getValue();
            break;
          }

          case this.isControl<MultiInput>(control, "sap.m.MultiInput"): {
            fieldData = control.getTokens().map((token) => token.getKey());
            break;
          }

          case this.isControl<DatePicker>(control, "sap.m.DatePicker"): {
            fieldData = control.getValue();
            break;
          }

          case this.isControl<TimePicker>(control, "sap.m.TimePicker"): {
            fieldData = control.getValue();
            break;
          }

          case this.isControl<MultiComboBox>(control, "sap.m.MultiComboBox"): {
            fieldData = control.getSelectedKeys();
            break;
          }

          case this.isControl<Select>(control, "sap.m.Select"): {
            fieldData = control.getSelectedKey();
            break;
          }

          case this.isControl<ComboBox>(control, "sap.m.ComboBox"): {
            fieldData = control.getSelectedKey();
            break;
          }

          case this.isControl<CheckBox>(control, "sap.m.CheckBox"): {
            fieldData = control.getSelected().toString();
            break;
          }

          case this.isControl<Switch>(control, "sap.m.Switch"): {
            fieldData = control.getState().toString();
            break;
          }
          default:
            break;
        }
        acc.push({
          groupName,
          fieldName,
          fieldData,
        });
      }

      return acc;
    }, []);
  };

  /**
   * Áp dụng các trường giá trị từ biến thể bộ lọc
   */
  private applyData = (data: unknown) => {
    (<FilterPayload[]>data).forEach((item) => {
      const { groupName, fieldName, fieldData } = item;
      const control = this.filterBar.determineControlByName(fieldName, groupName);

      switch (true) {
        case this.isControl<Input>(control, "sap.m.Input"): {
          control.setValue(<string>fieldData);
          break;
        }

        case this.isControl<TextArea>(control, "sap.m.TextArea"): {
          control.setValue(<string>fieldData);
          break;
        }

        case this.isControl<MultiInput>(control, "sap.m.MultiInput"): {
          const tokens = (<string[]>fieldData).map((key) => new Token({ key, text: key }));
          control.setTokens(tokens);
          break;
        }

        case this.isControl<DatePicker>(control, "sap.m.DatePicker"): {
          control.setValue(<string>fieldData);
          break;
        }

        case this.isControl<TimePicker>(control, "sap.m.TimePicker"): {
          control.setValue(<string>fieldData);
          break;
        }

        case this.isControl<MultiComboBox>(control, "sap.m.MultiComboBox"): {
          control.setSelectedKeys(<string[]>fieldData);
          break;
        }

        case this.isControl<Select>(control, "sap.m.Select"): {
          control.setSelectedKey(<string>fieldData);
          break;
        }

        case this.isControl<ComboBox>(control, "sap.m.ComboBox"): {
          control.setSelectedKey(<string>fieldData);
          break;
        }

        case this.isControl<CheckBox>(control, "sap.m.CheckBox"): {
          control.setSelected();
          break;
        }

        case this.isControl<Switch>(control, "sap.m.Switch"): {
          control.setState();
          break;
        }
        default:
          break;
      }
    });
  };

  //Lấy các bộ lọc có giá trị để hiển thị trên nhãn
  private getFiltersWithValues = () => {
    return this.filterBar.getFilterGroupItems().reduce<FilterGroupItem[]>((acc, item) => {
      const control = item.getControl();

      if (control) {
        switch (true) {
          case this.isControl<Input>(control, "sap.m.Input"): {
            const value = control.getValue();
            if (value) {
              acc.push(item);
            }
            break;
          }

          case this.isControl<TextArea>(control, "sap.m.TextArea"): {
            const value = control.getValue();
            if (value) {
              acc.push(item);
            }
            break;
          }

          case this.isControl<MultiInput>(control, "sap.m.MultiInput"): {
            const tokens = control.getTokens();

            if (tokens.length) {
              acc.push(item);
            }
            break;
          }

          case this.isControl<DatePicker>(control, "sap.m.DatePicker"): {
            const value = control.getValue();

            if (value) {
              acc.push(item);
            }
            break;
          }

          case this.isControl<TimePicker>(control, "sap.m.TimePicker"): {
            const value = control.getValue();

            if (value) {
              acc.push(item);
            }
            break;
          }

          case this.isControl<MultiComboBox>(control, "sap.m.MultiComboBox"): {
            const keys = control.getSelectedKeys();
            if (keys.length) {
              acc.push(item);
            }
            break;
          }

          case this.isControl<Select>(control, "sap.m.Select"): {
            const key = control.getSelectedKey();
            if (key) {
              acc.push(item);
            }
            break;
          }

          case this.isControl<ComboBox>(control, "sap.m.ComboBox"): {
            const key = control.getSelectedKey();
            if (key) {
              acc.push(item);
            }
            break;
          }

          case this.isControl<CheckBox>(control, "sap.m.CheckBox"): {
            const value = control.getSelected().toString();
            if (value) {
              acc.push(item);
            }
            break;
          }

          case this.isControl<Switch>(control, "sap.m.Switch"): {
            const value = control.getState().toString();
            if (value) {
              acc.push(item);
            }
            break;
          }
          default:
            break;
        }
      }

      return acc;
    }, []);
  };

  public onSelectionChange(event: FilterBar$FilterChangeEvent) {
    this.svm.currentVariantSetModified(true);
    this.filterBar.fireEvent("filterChange", event);
  }

  public onFilterChange() {
    this.updateLabelsAndTable();
  }

  public onAfterVariantLoad() {
    this.updateLabelsAndTable();
  }

  private updateLabelsAndTable() {
    const expandedLabel = this.filterBar.retrieveFiltersWithValuesAsTextExpanded();
    const snappedLabel = this.filterBar.retrieveFiltersWithValuesAsText();

    this.expandedLabel.setText(expandedLabel);
    this.snappedLabel.setText(snappedLabel);

    this.table.setShowOverlay(true);
  }

  public getFilters() {
    const filters = this.filterBar.getFilterGroupItems().reduce<Dict>((acc, item) => {
      const control = item.getControl();
      const name = item.getName();

      switch (true) {
        case this.isControl<Input>(control, "sap.m.Input"):
        case this.isControl<TextArea>(control, "sap.m.TextArea"): {
          const value = control.getValue();

          if (value) {
            acc[name] = value;
          }

          break;
        }
        case this.isControl<DatePicker>(control, "sap.m.DatePicker"):
        case this.isControl<TimePicker>(control, "sap.m.TimePicker"): {
          const value = control.getValue();

          if (value) {
            acc[name] = value;
          }

          break;
        }
        case this.isControl<Select>(control, "sap.m.Select"):
        case this.isControl<ComboBox>(control, "sap.m.ComboBox"): {
          const value = control.getSelectedKey();

          if (value) {
            acc[name] = value;
          }

          break;
        }
        default:
          break;
      }

      return acc;
    }, {});
    return filters;
  }
  // #endregion Filters

  public onSearch() {
    const oDataModel = this.getModel<ODataModel>();
    const tabeMoel = this.getModel<JSONModel>("table");

    this.table.setBusy(true);

    oDataModel.read("/LeaveRequestSet", {
      filters: [],
      // urlParameters: {},
      success: (response: ODataResponse<LeaveRequestItem[]>) => {
        this.table.setBusy(false);

        console.log("OData read success:", response.results);

        tabeMoel.setProperty("/rows", response.results);
      },
      error: (error: ODataError) => {
        this.table.setBusy(false);
        console.error("OData read error:", error);
      },
    });

    this.table.setShowOverlay(false);
  }

  private onRefresh() {
    this.filterBar.fireSearch();
  }

  // #region Formatters
  public formatStatusText(statusKey: string): string {
    const map: Record<string, string> = {
      "01": "New",
      "02": "Approved",
      "03": "Rejected",
    };
    return map[statusKey] ?? statusKey;
  }

  public formatStatusState(statusKey: string): ValueState {
    const map: Record<string, ValueState> = {
      "01": ValueState.Information,
      "02": ValueState.Success,
      "03": ValueState.Error,
    };
    return map[statusKey] ?? ValueState.None;
  }
  // #endregion Formatters

  //cấu hình nút sửa, xóa theo lựa chọn bảng
  public onRowSelectionChange() {
    const selectedIndices = this.table.getSelectedIndices();

    const tableModel = this.getModel<JSONModel>("table");

    tableModel.setProperty("/selectedIndices", [...selectedIndices]);
    // tableModel.setProperty("/selectedIndices", selectedIndices);
  }

  // #region Event handlers
  // #region Create
  async onAdd(): Promise<void> {
    try {
      if (!this.addDialog) {
        this.addDialog = await this.loadView<Dialog>("AddDialog");
      }
      const addMessagePopoverBtn = this.getControlById<Button>("messagePopoverBtn");

      if (!this.messagePopover) {
        this.createMessagePopover(addMessagePopoverBtn);
      }
      this.buttonMessagePop = addMessagePopoverBtn;

      this.addDialog.setModel(
        new JSONModel({
          LeaveType: "",
          StartDate: "",
          EndDate: "",
          Reason: "",
          TimeSlot: "",
          TimeSlotIndex: 0,
        } satisfies LeaveRequestForm),
        "form"
      );

      this.addDialog.open();
    } catch (error) {
      console.log(error);
    }
  }

  public onCancelAdd(): void {
    this.addDialog.close();
  }

  public onAfterCloseCreateRequest(event: Dialog$AfterCloseEvent) {
    const dialog = event.getSource();

    this.clearErrorMessages(dialog);

    dialog.setModel(null, "form");
  }

  public onSubmitCreateRequest(event: Button$PressEvent) {
    const control = event.getSource();
    const dialog = <Dialog>control.getParent();

    const formModel = <JSONModel>dialog.getModel("form");
    const formData = <LeaveRequestForm>formModel.getData();

    const oDataModel = this.getModel<ODataModel>();

    const isValid = this.onValidateBeforeSubmit(this.addDialog);
    if (!isValid) {
      this.updateMessageButton();
      setTimeout(() => this.messagePopover.openBy(this.buttonMessagePop), 0);

      return;
    }

    const { LeaveType, StartDate, EndDate, Reason, TimeSlot } = formData;

    dialog.setBusy(true);
    oDataModel.create(
      "/LeaveRequestSet",
      {
        LeaveType,
        StartDate: this.formatter.toUTCDate(StartDate),
        EndDate: this.formatter.toUTCDate(EndDate),
        Reason,
        TimeSlot: "01",
        Status: "01", // New
      },
      {
        success: (response: ODataResponse<LeaveRequestItem>) => {
          dialog.setBusy(false);

          MessageToast.show("Leave request created successfully.");

          this.onCancelAdd();

          this.onRefresh();
        },
        error: (error: ODataError) => {
          dialog.setBusy(false);
        },
      }
    );
  }
  // #endregion Create

  // #region Edit
  async onEditRequest(): Promise<void> {
    const indices = this.table.getSelectedIndices();

    if (!indices.length) {
      MessageToast.show("Please select one request to edit.");
      return;
    }

    try {
      if (!this.editDialog) {
        this.editDialog = await this.loadView<Dialog>("EditDialog");
      }

      const editMessagePopoverBtn = this.getControlById<Button>("editMessagePopoverBtn");
      console.log("dsds", editMessagePopoverBtn);

      if (!this.messagePopover) {
        this.createMessagePopover(editMessagePopoverBtn);
      }
      this.buttonMessagePop = editMessagePopoverBtn;

      // Lấy item đang chọn
      const item = <LeaveRequestItem>this.table.getContextByIndex(indices[0])?.getObject();

      this.editDialog.setModel(
        new JSONModel({
          RequestId: item.RequestId,
          LeaveType: item.LeaveType,
          StartDate: this.formatter.formatDate(item.StartDate, "yyyyMMdd", "yyyyMMdd"),
          EndDate: this.formatter.formatDate(item.EndDate, "yyyyMMdd", "yyyyMMdd"),
          Reason: item.Reason,
          TimeSlot: item.TimeSlot,
          TimeSlotIndex: item.TimeSlot ? parseInt(item.TimeSlot) - 1 : 0,
        }),
        "form"
      );

      this.editDialog.open();
    } catch (error) {
      console.log(error);
    }
  }

  public onCancelEdit(): void {
    this.editDialog.close();
  }

  public onAfterCloseEdit(event: Dialog$AfterCloseEvent) {
    const dialog = event.getSource();

    dialog.setModel(null, "form");
  }

  public onSubmitEditRequest(event: Button$PressEvent) {
    const control = event.getSource();
    const dialog = <Dialog>control.getParent();

    const formModel = <JSONModel>dialog.getModel("form");
    const formData = <LeaveRequestItem>formModel.getData();

    const oDataModel = this.getModel<ODataModel>();

    const isValid = this.onValidateBeforeSubmit(this.editDialog);
    if (!isValid) {
      this.updateMessageButton();
      setTimeout(() => this.messagePopover.openBy(this.buttonMessagePop), 0);

      return;
    }

    dialog.setBusy(true);
    const key = oDataModel.createKey("/LeaveRequestSet", { RequestId: formData.RequestId });

    oDataModel.update(
      key,
      {
        LeaveType: formData.LeaveType,
        StartDate: this.formatter.toUTCDate(formData.StartDate, "dd.MM.yyyy"),
        EndDate: this.formatter.toUTCDate(formData.EndDate, "dd.MM.yyyy"),
        Reason: formData.Reason,
        TimeSlot: formData.TimeSlot,
      },
      {
        success: (response: ODataResponse<LeaveRequestItem>) => {
          dialog.setBusy(false);

          MessageToast.show("Leave request updated successfully.");

          this.onCancelEdit();

          this.onRefresh();
        },
        error: (error: ODataError) => {
          dialog.setBusy(false);
        },
      }
    );
  }
  // #endregion Edit

  // #region Delete
  public onDeleteRequest() {
    const oDataModel = this.getModel<ODataModel>();

    const indices = this.table.getSelectedIndices();

    if (!indices.length) {
      MessageToast.show("Please select at least one request to delete.");
      return;
    }

    const item = <LeaveRequestItem>this.table.getContextByIndex(indices[0])?.getObject();

    MessageBox.confirm("Do you want to delete this request?", {
      actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
      emphasizedAction: MessageBox.Action.DELETE,
      onClose: (action: unknown) => {
        if (action === MessageBox.Action.DELETE) {
          const key = oDataModel.createKey("/LeaveRequestSet", item);

          oDataModel.remove(key, {
            success: () => {
              MessageToast.show("Leave request deleted successfully.");

              this.onRefresh();
            },
            error: (error: ODataError) => {
              console.log(error);
              MessageBox.error("Failed to delete the leave request.");
            },
          });
        }
      },
    });
  }
  // #endregion Delete
  // #endregion Event handlers

  // #region Validation
  public onChangeValue(event: Event) {
    try {
      const control = event.getSource<InputBase>();

      const binding = this.getBindingContextInfo(control);

      const fieldName = binding.name;

      console.log("binding", binding);

      if (control.getVisible()) {
        this.validateControl(control);

        if (this.isControl<DatePicker>(control, "sap.m.DatePicker")) {
          // Tìm cặp DatePicker còn lại
          const pairControl = this.getPairedDatePicker(control, fieldName);

          if (pairControl) {
            //Validate control còn lại
            this.validateControl(pairControl);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  //tìm DatePicker còn lại
  private getPairedDatePicker(currentControl: DatePicker, fieldName: string): DatePicker | undefined {
    const allPickers = this.getFormControlsByFieldGroup<DatePicker>({
      groupId: "FormField",
      types: ["sap.m.DatePicker"],
    });

    return allPickers.find((picker) => {
      if (picker === currentControl) return false;

      const binding = this.getBindingContextInfo(picker);
      const otherName = binding.name;

      return (
        (fieldName === "StartDate" && otherName === "EndDate") || (fieldName === "EndDate" && otherName === "StartDate")
      );
    });
  }

  private clearErrorMessages(container: Dialog) {
    const controls = this.getFormControlsByFieldGroup<InputBase>({
      groupId: "FormField",
      container: container,
    });

    controls.forEach((control) => {
      this.setMessageState(control, {
        message: "",
        severity: "None",
      });
    });
  }

  private onValidateBeforeSubmit(container: Dialog) {
    const controls = this.getFormControlsByFieldGroup<InputBase>({
      groupId: "FormField",
      container: container,
    });

    const isValid = this.validateControls(controls);

    if (isValid) {
      return true;
    } else {
      return false;
    }
  }

  private validateControls(controls: InputBase[]) {
    let isValid = false;
    let isError = false;

    controls.forEach((control) => {
      isError = this.validateControl(control);

      isValid = isValid || isError;
    });

    return !isValid;
  }

  private validateControl(control: InputBase): boolean {
    let isError = false;

    this.setMessageState(control, {
      message: "",
      severity: "None",
    });

    let requiredError = false;
    let outOfRangeError = false;
    let pastDateError = false;
    let dateRangeError = false;

    let value: string = "";

    switch (true) {
      case this.isControl<Input>(control, "sap.m.Input"): {
        value = control.getValue().trim();

        if (!value && control.getRequired()) {
          requiredError = true;
        }

        break;
      }
      case this.isControl<TextArea>(control, "sap.m.TextArea"): {
        value = control.getValue().trim();

        if (!value && control.getRequired()) {
          requiredError = true;
        }

        break;
      }
      case this.isControl<DatePicker>(control, "sap.m.DatePicker"): {
        value = control.getValue();

        const binding = this.getBindingContextInfo(control);

        const valueAsDate = control.getDateValue();

        if (!value && control.getRequired()) {
          requiredError = true;
        } else if (value && !control.isValidValue()) {
          outOfRangeError = true;
        } else if (!DateTime.IsSameOrAfter(valueAsDate, new Date())) {
          pastDateError = true;
        } else {
          //kiểm tra startdate > enddate
          if (valueAsDate && !pastDateError) {
            const pair = this.getPairedDatePicker(control, binding.name);

            if (!pair) break;

            const pairDate = pair.getDateValue();
            const startDate = binding.name === "StartDate" ? valueAsDate : pairDate;
            const endDate = binding.name === "EndDate" ? valueAsDate : pairDate;

            if (startDate && endDate && !DateTime.IsSameOrAfter(endDate, startDate)) {
              dateRangeError = true;
            }
          }
        }

        break;
      }
      case this.isControl<ComboBox>(control, "sap.m.ComboBox"): {
        value = control.getSelectedKey();

        const input = control.getValue().trim();

        if (!value && input) {
          outOfRangeError = true;
        } else if (!value && control.getRequired()) {
          requiredError = true;
        }

        break;
      }
      default:
        break;
    }

    if (requiredError) {
      this.setMessageState(control, {
        message: "Required",
        severity: "Error",
      });

      isError = true;
    } else if (outOfRangeError) {
      this.setMessageState(control, {
        message: "Invalid value",
        severity: "Error",
      });

      isError = true;
    } else if (pastDateError) {
      this.setMessageState(control, {
        message: "Date cannot be in the past",
        severity: "Error",
      });

      isError = true;
    } else if (dateRangeError) {
      this.setMessageState(control, {
        message: "Start date must be before end date",
        severity: "Error",
      });

      isError = true;
    }
    this.updateMessageButton();

    return isError;
  }

  private setMessageState(
    control: InputBase,
    options: {
      message: string;
      severity: keyof typeof ValueState;
    }
  ) {
    const { message, severity } = options;
    this.addMessageToManager(control, message, severity);

    control.setValueState(severity);
    control.setValueStateText?.(message);
  }

  //hàm mở đóng messagePopover
  public handleMessagePopoverPress(event: Event) {
    const button = event.getSource<Button>();

    if (!this.messagePopover) {
      this.createMessagePopover(button);
    } else {
      button.addDependent(this.messagePopover);
    }

    this.messagePopover.toggle(button);
  }

  //tạo message popover
  private createMessagePopover(button: Button) {
    this.messagePopover = new MessagePopover({
      activeTitlePress: (event) => {
        const item = event.getParameter("item");
        if (!item) return;

        const message = <Message>item.getBindingContext("message")?.getObject();
        const controlId = message.getControlId();

        if (controlId && typeof controlId === "string") {
          const control = ElementRegistry.get(controlId);
          if (control) {
            control.getDomRef()?.scrollIntoView({ behavior: "smooth", block: "center" });
            control.focus();
          }
        }
      },

      items: {
        path: "message>/",
        template: new MessageItem({
          title: "{message>message}",
          subtitle: "{message>additionalText}",
          type: "{message>type}",
          activeTitle: true,
          description: "{message>message}",
        }),
      },
      groupItems: true,
    });

    button.addDependent(this.messagePopover);
  }

  private isPositionable(controlId: string): boolean {
    return controlId ? true : true;
  }

  private addMessageToManager(control: InputBase, message: string, type: keyof typeof MessageType) {
    const bindingInfo = this.getBindingContextInfo(control);
    const target = bindingInfo.target;
    if (!target) return;

    this.removeMessageFromTarget(target);
    if (type !== "None") {
      this.messageManager.addMessages(
        new Message({
          message,
          type,
          additionalText: bindingInfo.label || "",
          target: target,
          processor: bindingInfo.processor || control.getModel(),
        })
      );
    }
  }

  private removeMessageFromTarget(target: string) {
    const messageManager = this.messageManager;
    const messages = <Message[]>messageManager.getMessageModel().getData();

    const toRemove = messages.filter((msg) => msg.getTargets().includes(target));
    if (toRemove.length > 0) {
      messageManager.removeMessages(toRemove);
    }

    this.updateMessageButton();
  }

  //Hiển thị loại nút theo thông báo có mức độ nghiêm trọng cao nhất
  public buttonTypeFormatter(): "Negative" | "Critical" | "Success" | "Neutral" | undefined {
    let highestSeverity: "Negative" | "Critical" | "Success" | "Neutral" | undefined;

    const aMessages = <Message[]>this.messageManager.getMessageModel().getData();
    aMessages.forEach((sMessage) => {
      switch (sMessage.getType()) {
        case MessageType.Error:
          highestSeverity = "Negative";
          break;
        case MessageType.Warning:
          highestSeverity = highestSeverity !== "Negative" ? "Critical" : highestSeverity;
          break;
        case MessageType.Success:
          highestSeverity =
            highestSeverity !== "Negative" && highestSeverity !== "Critical" ? "Success" : highestSeverity;
          break;
        default:
          highestSeverity = !highestSeverity ? "Neutral" : highestSeverity;
          break;
      }
    });

    return highestSeverity;
  }

  //Hiển thị số lượng tin nhắn có mức độ nghiêm trọng cao nhất
  public highestSeverityMessages(): string {
    const highestSeverityIconType = this.buttonTypeFormatter();

    let highestSeverityMessageType: MessageType;

    switch (highestSeverityIconType) {
      case "Negative":
        highestSeverityMessageType = MessageType.Error;
        break;
      case "Critical":
        highestSeverityMessageType = MessageType.Warning;
        break;
      case "Success":
        highestSeverityMessageType = MessageType.Success;
        break;
      default:
        highestSeverityMessageType = MessageType.Information;
        break;
    }

    const messages = <Message[]>this.messageManager.getMessageModel().getData();

    const count = messages.reduce((total, msg) => {
      return msg.getType() === highestSeverityMessageType ? total + 1 : total;
    }, 0);

    return count > 0 ? count.toString() : "";
  }

  //xác định icon phù hợp nhất hiển thị trên nút MessagePopover
  public buttonIconFormatter() {
    let icon: string | undefined;
    let messages = <Message[]>this.messageManager.getMessageModel().getData();

    messages.forEach((message: Message) => {
      switch (message.getType()) {
        case "Error":
          icon = "sap-icon://error";
          break;
        case "Warning":
          icon = icon !== "sap-icon://error" ? "sap-icon://alert" : icon;
          break;
        case "Success":
          icon = icon !== "sap-icon://error" && icon !== "sap-icon://alert" ? "sap-icon://sys-enter-2" : icon;
          break;
        default:
          icon = !icon ? "sap-icon://information" : icon;
          break;
      }
    });
    return icon ?? "";
  }

  private updateMessageButton() {
    if (!this.buttonMessagePop) return;
    this.buttonMessagePop.setType(this.buttonTypeFormatter());
    this.buttonMessagePop.setIcon(this.buttonIconFormatter());
    this.buttonMessagePop.setText(this.highestSeverityMessages());
  }

  public onRadioSelectionChange(event: RadioButtonGroup$SelectEvent) {
    const control = event.getSource();

    const context = <Context>control.getBindingContext("form");
    const formModel = <JSONModel>context.getModel();
    const path = context.getPath();

    const selectedIndex = control.getSelectedIndex();

    const options = <FieldValueHelpItem[]>this.getModel("master").getProperty("/TimeSlot");

    const { FieldKey } = options[selectedIndex];

    formModel.setProperty(`${path}/TimeSlot`, FieldKey);
  }
  // #endregion Validation

  // #region Export to Excel
  public onExportExcel(): void {
    const data = this.getModel<JSONModel>("table").getProperty("/rows");

    //cấu hình cột
    const Cols = [
      { label: "Mã đơn nghỉ", property: "RequestId", type: "string" },
      { label: "Loại phép", property: "LeaveType", type: "string" },
      { label: "Ngày bắt đầu", property: "StartDate", type: "date", format: "dd.MM.yyyy" },
      { label: "Ngày kết thúc", property: "EndDate", type: "date", format: "dd.MM.yyyy" },
      { label: "TimeSlot", property: "TimeSlot", type: "string" },
      { label: "Lý do xin nghỉ", property: "Reason", type: "string" },
      { label: "Trạng thái", property: "Status", type: "string" },
    ];

    //cấu hình xuất file
    const settings = {
      workbook: { columns: Cols },
      dataSource: data,
      fileName: "LeaveRequests.xlsx",
      // Worker: false,
    };

    //khởi tạo và xuất file
    const spreadsheet = new Spreadsheet(settings);
    spreadsheet
      .build()
      .then(() => {
        console.log("Spreadsheet export successful");
      })
      .catch((err) => {
        console.error("Spreadsheet export error:", err);
      });
  }
  // #endregion Export to Excel

  // #region Master data
  private async onGetMasterData() {
    return new Promise((resolve, reject) => {
      const oDataModel = this.getModel<ODataModel>();
      const masterModel = this.getModel("master");

      oDataModel.read("/FieldValueHelpSet", {
        success: (response: ODataResponse<FieldValueHelpItem[]>) => {
          console.log("Raw FieldValueHelpSet data:", response.results);

          const status: FieldValueHelpItem[] = [];
          const leaveType: FieldValueHelpItem[] = [];
          const timeSlot: FieldValueHelpItem[] = [];

          response.results.forEach((item) => {
            switch (item.FieldName) {
              case "Status": {
                status.push(item);
                break;
              }
              case "LeaveType": {
                leaveType.push(item);
                break;
              }
              case "TimeSlot": {
                timeSlot.push(item);
                break;
              }
              default:
                break;
            }
          });

          masterModel.setProperty("/Status", status);
          masterModel.setProperty("/LeaveType", leaveType);
          masterModel.setProperty("/TimeSlot", timeSlot);

          console.log("Master data loaded:", masterModel.getData());

          resolve(true);
        },
        error: (error: ODataError) => {
          reject(error);
        },
      });
    });
  }
  // #endregion Master data
}
