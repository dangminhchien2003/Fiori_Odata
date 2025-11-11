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
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import type { Dict } from "base/types/utils";
import type ODataModel from "sap/ui/model/odata/v2/ODataModel";
import type { ODataError, ODataResponse } from "base/types/odata";
import type { FieldValueHelpItem, LeaveRequestItem } from "base/types/pages/main";
import { ValueState } from "sap/ui/core/library";
import type Button from "sap/m/Button";
import type Dialog from "sap/m/Dialog";
import Spreadsheet from "sap/ui/export/Spreadsheet";

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
  private dialog: Dialog;

  public override onInit(): void {
    // this.model = new JSONModel();
    // void this.model.loadData(sap.ui.require.toUrl("base/model/model.json"), undefined, false);
    // this.getView()?.setModel(this.model);

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
  }

  // #region Lifecycle hook
  public override onAfterRendering(): void | undefined {
    this.filterBar.fireSearch();

    const oDataModel = this.getModel<ODataModel>();
    if (oDataModel) {
      void this.loadGetMasterData().catch(console.error);
    } else {
      console.error("OData model vẫn chưa sẵn sàng!");
    }
  }
  // #endregion Lifecycle hook

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
    // this.onSearch();
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

    // Lấy filters từ các control
    // const filterValues = this.getFilters();
    // console.log("Filter values from controls:", filterValues);

    // Chuyển đổi object thành mảng Filter cho OData
    // const filters = Object.keys(filterValues).map((key) => {
    //   const value = filterValues[key];
    //   console.log(`Creating filter: path=${key}, value=${value}`);
    //   return new Filter(key, FilterOperator.EQ, value);
    // });

    // console.log("Filters for OData read:", filters);
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

  //format status text
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

  //load master data
  private async loadGetMasterData() {
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

          masterModel.setProperty("/status", status);
          masterModel.setProperty("/leaveType", leaveType);
          masterModel.setProperty("/timeSlot", timeSlot);

          console.log("Master data loaded:", masterModel.getData());

          resolve(true);
        },
        error: (error: ODataError) => {
          reject(error);
        },
      });
    });
  }

  //cấu hình nút sửa, xóa theo lựa chọn bảng
  public onRowSelectionChange() {
    const selectedIndices = this.table.getSelectedIndices();
    const enable = selectedIndices.length === 1;

    this.getControlById<Button>("btnEdit").setEnabled(enable);
    this.getControlById<Button>("btnDelete").setEnabled(enable);
  }

  //onAdd
  async onAdd(): Promise<void> {
    this.dialog ??= (await this.loadFragment({
      name: "base.view.AddDialog",
    })) as Dialog;
    this.dialog.open();
  }

  //onEdit
  public onEdit(): void {
    console.log("Edit button clicked");
  }

  //onDelete
  public onDelete(): void {
    console.log("Delete button clicked");
  }

  //onExportExcel
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

  // onCancel
  public onCancelAdd(): void {
    this.dialog.close();
  }
}
