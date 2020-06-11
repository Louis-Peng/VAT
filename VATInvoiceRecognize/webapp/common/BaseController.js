sap.ui.define([
	"sap/ui/core/mvc/Controller"
], /**
 * @param {typeof sap.ui.core.mvc.Controller} Controller 
 */
function (Controller) {
    "use strict";
    return Controller.extend("ns.VATInvoiceRecognize.common.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		navTo: function (sName, oParameters, bReplace) {
			this.getRouter().navTo(sName, oParameters, bReplace);
		},

        removeDeferredGroupId: function(aId) {
			var aDeferredGroups = this.getOwnerComponent().getModel().getDeferredGroups();
			aId.map(function(sId) {
				if (aDeferredGroups.indexOf(sId) !== -1) {
					aDeferredGroups.splice(aDeferredGroups.indexOf(sId), 1);
				}
			});
			return aDeferredGroups;
		},

		setBusyStatus: function (aControl, bStatus) {
			aControl.forEach(function (oControl) {
				if (oControl) {
					oControl.setBusy(bStatus);
				}
			});
		}
	});
});