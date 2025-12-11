import type FlexibleColumnLayout from "sap/f/FlexibleColumnLayout";
import FlexibleColumnLayoutSemanticHelper from "sap/f/FlexibleColumnLayoutSemanticHelper";
import { LayoutType } from "sap/f/library";
import type Control from "sap/ui/core/Control";
import View from "sap/ui/core/mvc/View";
import BaseComponent from "sap/ui/core/UIComponent";
import Device from "sap/ui/Device";
import JSONModel from "sap/ui/model/json/JSONModel";
import { createDeviceModel } from "./model/models";
import type { ComponentData, Dict } from "./types/utils";
import Messaging from "sap/ui/core/Messaging";
import type MessageProcessor from "sap/ui/core/message/MessageProcessor";
import ControlMessageProcessor from "sap/ui/core/message/ControlMessageProcessor";
import { ErrorHandler } from "./controller/ErrorHandler";

/**
 * @namespace base
 */
export default class Component extends BaseComponent {
  public static metadata = {
    manifest: "json",
    interfaces: ["sap.ui.core.IAsyncContentCreation"],
  };

  private MessageManager: Messaging;
  private MessageProcessor: MessageProcessor;
  private ErrorHandler: ErrorHandler;

  public override init(): void {
    // call the base component's init function
    super.init();

    this.setModel(
      new JSONModel({
        MessageTitle: "",
        MessageDescription: "",
      }),
      "global"
    );

    // Message manager
    this.MessageManager = Messaging;
    this.MessageProcessor = new ControlMessageProcessor();
    this.MessageManager.registerMessageProcessor(this.MessageProcessor);

    this.ErrorHandler = new ErrorHandler(this);

    this.setModel(this.MessageManager.getMessageModel(), "message");

    // set the device model
    this.setModel(createDeviceModel(), "device");

    // enable routing
    this.getRouter().initialize();
  }

  // Initialize the application asynchronously
  // It makes the application a lot faster and, through that, better to use.
  public override createContent(): Control | Promise<Control | null> | null {
    const appView = View.create({
      viewName: `${this.getAppID()}.view.App`,
      type: "XML",
      viewData: { component: this },
    });

    appView
      .then((view) => {
        view.addStyleClass(this.getContentDensityClass());
      })
      .catch((error) => {
        console.log(error);
      });

    return appView;
  }

  public getAppID() {
    return <string>this.getManifestEntry("/sap.app/id");
  }

  public getMessageManager() {
    return this.MessageManager;
  }

  public getContentDensityClass(): string {
    return Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact";
  }

  public getStartupParameters() {
    if (!this.getComponentData()) {
      return {};
    }

    const parameters = (<ComponentData>this.getComponentData()).startupParameters;

    const values = Object.keys(parameters).reduce<Dict>((acc, key) => {
      acc[key] = parameters[key][0];
      return acc;
    }, {});

    return values;
  }

  public getFCLHelper() {
    const fcl = <FlexibleColumnLayout>(<View>this.getRootControl()).byId("fcl");

    return FlexibleColumnLayoutSemanticHelper.getInstanceFor(fcl, {
      defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
      defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
      maxColumnsCount: 2,
    });
  }
}
