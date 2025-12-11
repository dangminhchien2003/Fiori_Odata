import MessageBox from "sap/m/MessageBox";
import type ODataModel from "sap/ui/model/odata/v2/ODataModel";
import type {
  ODataModel$BatchRequestFailedEvent,
  ODataModel$MetadataFailedEvent,
  ODataModel$RequestFailedEvent,
} from "sap/ui/model/odata/v2/ODataModel";
import type Component from "../Component";

export class ErrorHandler {
  private component: Component;
  private model: ODataModel;
  private messageOpen: boolean;

  constructor(component: Component) {
    this.component = component;
    this.messageOpen = false;

    // Model
    this.model = <ODataModel>this.component.getModel();

    // Handlers
    this.model.attachMetadataFailed(this.requestMetadataFailedHandler);
    this.model.attachRequestFailed(this.requestFailedHandler);
  }

  private requestMetadataFailedHandler = (event: ODataModel$MetadataFailedEvent) => {
    const response = event.getParameter("response");
    this.showServiceError(response);
  };

  private requestFailedHandler = (event: ODataModel$BatchRequestFailedEvent & ODataModel$RequestFailedEvent) => {
    const response = event.getParameter("response");
    this.showServiceError(response);
  };

  // Show a MessageBox when a service call has failed.
  // Only the first error message will be display.
  private showServiceError(details?: string | object) {
    if (this.messageOpen) {
      return;
    }

    this.messageOpen = true;

    MessageBox.error("Error", {
      details,
      styleClass: this.component.getContentDensityClass(),
      onClose: () => {
        this.messageOpen = false;
      },
    });
  }
}
