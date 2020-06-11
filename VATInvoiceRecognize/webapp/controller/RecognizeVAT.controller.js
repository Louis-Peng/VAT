/* global _, sap */
sap.ui.define([
	"ns/VATInvoiceRecognize/common/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/base/Log",
    "sap/m/MessageBox"
],
// @ts-ignore
/**
 * @param {typeof sap.ui.model.json.JSONModel} JSONModel
 * @param {typeof sap.m.MessageToast} MessageToast
 * @param {typeof sap.ui.core.Fragment} Fragment
 * @param {typeof sap.base.Log} Log
 * @param {{ error: (arg0: string) => void; }} MessageBox
 */
function (Controller, JSONModel, MessageToast, Fragment, Log, MessageBox) {
    "use strict";
    return Controller.extend("ns.VATInvoiceRecognize.controller.RecognizeVAT", {
        onInit: function () {
            this.oI18n = this.getResourceBundle();
			this.oView = this.getView();
			this.oOwnerComponent = this.getOwnerComponent();
            this.oDataModel = this.oOwnerComponent.getModel();
            // @ts-ignore
            var config = this.oOwnerComponent.getManifest();
			// @ts-ignore
			this.oView.setModel(new JSONModel({
                access_token: "",
                invoiceInfo: {
                    Dup: "",
                    Pic: "",
                    Invoicetype: "",
                    Invoicecode: "",
                    Invoicenum: "",
                    Checkcode: "",
                    Invoicedate: "",
                    Password: "",
                    Totalamount: "",
                    Totaltax: "",
                    Remarks: "",
                    Sellername: "",
                    Sellerregisternum: "",
                    Selleraddress: "",
                    Sellerbank: "",
                    Payee: "",
                    Checker: "",
                    Notedrawer: "",
                    Purchasername: "",
                    Purchaserregisternum: "",
                    Purchaseraddress: "",
                    Purchaserbank: "",
                    INVOICE_ITEMSet: []
                },
                resInvoiceInfo: {}
            }), "viewModel");
            this.viewModel = this.oView.getModel("viewModel");
            // @ts-ignore
            this.oInvoiceInfoClone = _.cloneDeep(this.viewModel.getProperty("/invoiceInfo"));
            this._fetchOcrToken();
			this.getRouter().getRoute("RecognizeVAT").attachPatternMatched(this._onRouterMatched, this);
		},

        onAfterRendering: function() {//capture="camera"
            // var sInvoiceUploaderId = this.oView.byId("invoicefileUploader").getId();
            // $("#" + sInvoiceUploaderId).attr("capture", "camera");
        },

		_onRouterMatched: function() {},

        onPressGetLocation: function() {
			function getLocation() {
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(function(position) {
						alert("Latitude: " + position.coords.latitude + 
					    "<br>Longitude: " + position.coords.longitude);
					},
					function(error) {
						alert(error.message);
					},
					{
						enableHighAccuracy: true
					});
				} else {
					console.log("Geolocation is not supported by this browser.");
				}
			}
			getLocation();
		},

        _fetchOcrToken: function() {
            var that = this;
            var sServiceUrl = "/nsVATInvoiceRecognize/baiduApiOCR/oauth/2.0/token?grant_type=client_credentials&client_id=XPP40XKY5nbfAFcxUKKXkGF1&client_secret=XOK3UxRCZhj9EVnRfq1kb37tHjGFLhaM"
            // @ts-ignore
            // eslint-disable-next-line no-undef
            axios.post(sServiceUrl, {})
            .then(function (response) {
                // eslint-disable-next-line no-console
                that.viewModel.setProperty("/access_token", response.data.access_token);
            })
            .catch(function (error) {
                // eslint-disable-next-line no-console
                Log.error("获取百度Access Token失败: ", error.error_description);
            });
        },

        handlePressViewInvoiceImg: function(oEvent) {
            var oButton = oEvent.getSource();
			// create popover
			if (!this._oImgPreviewPopover) {
				Fragment.load({
					name: "ns.VATInvoiceRecognize.fragment.PreviewVATInvoiceImg",
					controller: this
				}).then(function(pPopover) {
					this._oImgPreviewPopover = pPopover;
					this.getView().addDependent(this._oImgPreviewPopover);
					// this._oImgPreviewPopover.bindElement("/ProductCollection/0");
					this._oImgPreviewPopover.openBy(oButton);
				}.bind(this));
			} else {
				this._oImgPreviewPopover.openBy(oButton);
			}
        },

		handleCloseInvoicePreviewPress: function () {
			this._oImgPreviewPopover.close();
		},

        /* onPressUploadBtn: function(oEvent) {
            var oButton = oEvent.getSource();
            if (!this._oImgActionPopover) {
				Fragment.load({
					name: "ns.VATInvoiceRecognize.fragment.ActionPopover",
					controller: this
				}).then(function(pPopover) {
					this._oImgActionPopover = pPopover;
					this.getView().addDependent(this._oImgActionPopover);
					// this._oImgActionPopover.bindElement("/ProductCollection/0");
					this._oImgActionPopover.openBy(oButton);
				}.bind(this));
			} else {
				this._oImgActionPopover.openBy(oButton);
			}
        }, */

        handleFileSizeExceed: function(oEvent) {
            var iFileSize = oEvent.getParameter("fileSize");
            if (iFileSize > 4) {
                MessageBox.error("所选文件过大，请压缩至小于或等于4M，再重新选择！");
                return;
            }
        },
        
        handleUploadInvoiceChange: function(oEvent) {
            var file = oEvent.getParameter("files")[0];
            if (!file) {
                return;
            }
            // eslint-disable-next-line no-undef
            var reader = new FileReader();
            reader.onload = function () {
                // alert("onload");
                // eslint-disable-next-line no-undef
                var formData = new FormData();
                var imageString = reader.result;
                // @ts-ignore
                imageString = imageString.replace("\r\n", "");
                // @ts-ignore
                imageString = imageString.replace("\\+", "%2B");
                // @ts-ignore
                var newstr = imageString.split(",");
                imageString = newstr[1];
                // @ts-ignore
                formData.append("image", imageString); 
                // this.viewModel.setProperty("/invoiceInfo/Pic", "");
                this._recognitionForVatInvoice(formData, newstr);
            }.bind(this);
            reader.readAsDataURL(file);
        },
        
        _recognitionForVatInvoice: function(oFormData, aImgData) {
            var that = this;
            var sAccessToken = this.viewModel.getProperty("/access_token");
            var sServiceUrl = "/nsVATInvoiceRecognize/baiduApiOCR/rest/2.0/ocr/v1/vat_invoice?access_token=" + sAccessToken;
            that.viewModel.setProperty("/invoiceInfo", that.oInvoiceInfoClone);
            this.viewModel.setProperty("/invoiceInfo/Pic", aImgData.join(","));
            var aControl = [this.oView.byId("idRecognizeVATPage")];
			this.setBusyStatus(aControl, true);
            // @ts-ignore
            axios.post(sServiceUrl, oFormData, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
            .then(function (response) {
                that.setBusyStatus(aControl, false);
                if (response.status === 200 && response.statusText === "OK") {
                    that.viewModel.setProperty("/resInvoiceInfo", response.data.words_result);
                    that.viewModel.setProperty("/invoiceInfo", that._formatVatInvoiceInfoData());
                } else {
                    sap.m.MessageToast.show("待识别票据图像错误，识别失败！请确认图像无误，重新提交识别！");
                }
            })
            .catch(function (error) {
                // eslint-disable-next-line no-console
                that.setBusyStatus(aControl, false);
                sap.m.MessageToast.show("待识别票据图像错误，识别失败！请确认图像无误，重新提交识别！");
                Log.error("百度OCR识别失败: ", error.error_description);
            });
        },

        _formatVatInvoiceInfoData: function() {
            var oInvoiceInfoForModel = {};
            // @ts-ignore
            var oResInvoiceInfoClone = _.cloneDeep(this.viewModel.getProperty("/resInvoiceInfo"));
            // @ts-ignore
            // @ts-ignore
            var oResInvoiceInfoUpdatedKeys = _.mapKeys(oResInvoiceInfoClone, function(value, key) {
                // @ts-ignore
                return _.capitalize(key);
            });
            // @ts-ignore
            Object.assign(oInvoiceInfoForModel, _.pick(oResInvoiceInfoUpdatedKeys, [
                "Invoicetype",
                "Invoicecode",
                "Invoicenum",
                "Checkcode",
                "Invoicedate",
                "Password",
                "Totalamount",
                "Totaltax",
                "Remarks",
                "Sellername",
                "Sellerregisternum",
                "Selleraddress",
                "Sellerbank",
                "Payee",
                "Checker",
                "Notedrawer",
                "Purchasername",
                "Purchaserregisternum",
                "Purchaseraddress",
                "Purchaserbank"
            ]));
            var oCommodityResInfo = {};
            // @ts-ignore
            Object.assign(oCommodityResInfo, _.pick(oResInvoiceInfoUpdatedKeys, [
                "Commodityname",
                "Commoditytype",
                "Commoditynum",
                "Commodityunit",
                "Commodityprice",
                "Commodityamount",
                "Commoditytaxrate",
                "Commoditytax"
            ]));
            var aCommodityResInfo = [];
            // @ts-ignore
            // @ts-ignore
            _.forOwn(oCommodityResInfo, function(value, key, obj) {
                // @ts-ignore
                // @ts-ignore
                value.map(function(item, index) {
                    aCommodityResInfo.push({[key]: item.word, row: item.row});
                });
            });
            // @ts-ignore
            // @ts-ignore
            var oCommodityResInfoGroupby = _.groupBy(aCommodityResInfo, function(obj, key) {
                return obj.row;
            });
            var aCommodityResInfoFormat = [];
            // @ts-ignore
            // @ts-ignore
            _.forOwn(oCommodityResInfoGroupby, function(vaule, key) {
                var oObj = {};
                // @ts-ignore
                // @ts-ignore
                vaule.map(function(item, index) {
                    // @ts-ignore
                    oObj = Object.assign(oObj, item);
                });
                // @ts-ignore
                aCommodityResInfoFormat.push(_.omit(oObj, ["row"]));
            });
            // @ts-ignore
            Object.assign(oInvoiceInfoForModel, {
                "Dup": "",
                "Pic": this.viewModel.getProperty("/invoiceInfo/Pic"),
                "INVOICE_ITEMSet": aCommodityResInfoFormat
            });
            return oInvoiceInfoForModel;
        },

        handlePressSubmit: function() {
            // @ts-ignore
            // var oInvoiceInfoClone = _.cloneDeep(this.viewModel.getProperty("/invoiceInfo"));
            // var aDeferredGroups = this.removeDeferredGroupId(["VatInvoiceEntity"]);
            // @ts-ignore
            /* var oInvoiceInfoOmitCommodityInfo = _.omit(oInvoiceInfoClone, ["CommodityListData"]);
            var aCommodityList = oInvoiceInfoClone["CommodityListData"];
            var oCommodityListData = {
                "INVOICE_ITEMSet": aCommodityList
            }; */
            // @ts-ignore
            // var oParam = Object.assign(oInvoiceInfoOmitCommodityInfo, oCommodityListData);
            var oParam = _.cloneDeep(this.viewModel.getProperty("/invoiceInfo"));
            var aControl = [this.oView.byId("idRecognizeVATPage")];
            this.setBusyStatus(aControl, true);
            this.oDataModel.create("/INVOICE_HEADERSet", oParam, {
                success: function(oData) {
                    this.viewModel.setProperty("/invoiceInfo/Pic", "");
                    this.viewModel.setProperty("/invoiceInfo", Object.assign(this.oInvoiceInfoClone, {
                        "Pic": ""
                    }));
                    this.setBusyStatus(aControl, false);
                    if (oData["Dup"] === "X") {
                        MessageBox.error("重复提交，请重新选择！");
                        return;
                    }
                    sap.m.MessageToast.show("提交成功！");
                }.bind(this),
                // @ts-ignore
                // @ts-ignore
                error: function(error) {
                    this.setBusyStatus(aControl, false);
                    sap.m.MessageToast.show("提交失败，请检查数据后，重新提交！");
                }.bind(this)
            });
            /* var aParam = aCommodityList.map(function(obj) {
                // @ts-ignore
                return Object.assign(_.pick(oInvoiceInfoOmitCommodityInfo, ["Invoicetype", "Invoicecode", "Invoicenum"]), obj);
            });
            this.oDataModel.create("/INVOICE_HEADERSet", oInvoiceInfoOmitCommodityInfo, {
				groupId: "VatInvoiceEntity"
			});
			this.oDataModel.create("/INVOICE_ITEMSet", aParam, {
				groupId: "VatInvoiceEntity"
			});
            if (aDeferredGroups.indexOf("VatInvoiceEntity") === -1) {
				aDeferredGroups = aDeferredGroups.concat(["VatInvoiceEntity"]);
			}
            this.oDataModel.setDeferredGroups(aDeferredGroups);
            this.oDataModel.submitChanges({
				success: function(oData) {
					this.setBusyStatus(aControl, false);
					var aBatchRes = oData.__batchResponses[0].__changeResponses;
					if (aBatchRes[0].statusCode === "201" && aBatchRes[0].statusText === "Created") {}
				}.bind(this),
				error: function(oError) {
					this.setBusyStatus(aControl, false);
					return false;
				}.bind(this)
			}); */
            
        },
        
        onExit : function () {
            var aPopover = [this._oImgPreviewPopover, this._oImgActionPopover];
            aPopover.map(function(oPopover) {
                if (oPopover) {
                    oPopover.destroy();
                }
            });
		}
    });
});