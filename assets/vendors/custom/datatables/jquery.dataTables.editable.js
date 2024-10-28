/*
* File:        jquery.dataTables.editable.js
* Version:     2.3.3.
* Author:      Jovan Popovic
*
* Copyright 2010-2012 Jovan Popovic, all rights reserved.
*
* This source file is free software, under either the GPL v2 license or a
* BSD style license, as supplied with this software.
*
* This source file is distributed in the hope that it will be useful, but
* WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
* or FITNESS FOR A PARTICULAR PURPOSE.
*
* Parameters:
* @sUpdateURL                       String      URL of the server-side page used for updating cell. Default value is "UpdateData".
* @sAddURL                          String      URL of the server-side page used for adding new row. Default value is "AddData".
* @sDeleteURL                       String      URL of the server-side page used to delete row by id. Default value is "DeleteData".
* @fnShowError                      Function    function(message, action){...}  used to show error message. Action value can be "update", "add" or "delete".
* @sAddNewRowFormId                 String      Id of the form for adding new row. Default id is "formAddNewRow".
* @oAddNewRowFormOptions            Object        Options that will be set to the "Add new row" dialog
* @sAddNewRowButtonId               String      Id of the button for adding new row. Default id is "btnAddNewRow".
* @oAddNewRowButtonOptions            Object        Options that will be set to the "Add new" button
* @sAddNewRowOkButtonId             String      Id of the OK button placed in add new row dialog. Default value is "btnAddNewRowOk".
* @oAddNewRowOkButtonOptions        Object        Options that will be set to the Ok button in the "Add new row" form
* @sAddNewRowCancelButtonId         String      Id of the Cancel button placed in add new row dialog. Default value is "btnAddNewRowCancel".
* @oAddNewRowCancelButtonOptions    Object        Options that will be set to the Cancel button in the "Add new row" form
* @sDeleteRowButtonId               String      Id of the button for adding new row. Default id is "btnDeleteRow".
* @oDeleteRowButtonOptions            Object        Options that will be set to the Delete button
* @sSelectedRowClass                String      Class that will be associated to the selected row. Default class is "row_selected".
* @sReadOnlyCellClass               String      Class of the cells that should not be editable. Default value is "read_only".
* @sAddDeleteToolbarSelector        String      Selector used to identify place where add and delete buttons should be placed. Default value is ".add_delete_toolbar".
* @fnStartProcessingMode            Function    function(){...} called when AJAX call is started. Use this function to add "Please wait..." message  when some button is pressed.
* @fnEndProcessingMode              Function    function(){...} called when AJAX call is ended. Use this function to close "Please wait..." message.
* @aoColumns                        Array       Array of the JEditable settings that will be applied on the columns
* @sAddHttpMethod                   String      Method used for the Add AJAX request (default is 'POST')
* @sAddDataType                     String      Data type expected from the server when adding a row; allowed values are the same as those accepted by JQuery's "datatype" parameter, e.g. 'text' and 'json'. The default is 'text'.
* @sDeleteHttpMethod                String      Method used for the Delete AJAX request (default is 'POST')
* @sDeleteDataType                  String      Data type expected from the server when deleting a row; allowed values are the same as those accepted by JQuery's "datatype" parameter, e.g. 'text' and 'json'. The default is 'text'.
* @fnOnDeleting                     Function    function(tr, id, fnDeleteRow){...} Function called before row is deleted.
tr isJQuery object encapsulating row that will be deleted
id is an id of the record that will be deleted.
fnDeleteRow(id) callback function that should be called to delete row with id
returns true if plugin should continue with deleting row, false will abort delete.
* @fnOnDeleted                      Function    function(status){...} Function called after delete action. Status can be "success" or "failure"
* @fnOnAdding                       Function    function(){...} Function called before row is added.
returns true if plugin should continue with adding row, false will abort add.
* @fnOnNewRowPosted                    Function    function(data) Function that can override default function that is called when server-side sAddURL returns result
You can use this function to add different behaviour when server-side page returns result
* @fnOnAdded                        Function    function(status){...} Function called after add action. Status can be "success" or "failure"
* @fnOnEditing                      Function    function(input){...} Function called before cell is updated.
input JQuery object wrapping the input element used for editing value in the cell.
returns true if plugin should continue with sending AJAX request, false will abort update.
* @fnOnEdited                       Function    function(status){...} Function called after edit action. Status can be "success" or "failure"
* @sEditorHeight                    String      Default height of the cell editors
* @sEditorWidth                     String      Default width of the cell editors
* @oDeleteParameters                Object      Additonal objects added to the DELETE Ajax request
* @oUpdateParameters                Object      Additonal objects added to the UPDATE Ajax request
* @sIDToken                         String      Token in the add new row dialog that will be replaced with a returned id of the record that is created eg DT_RowId
* @sSuccessResponse                 String        Text returned from the server if record is successfully deleted or edited. Default "ok"
* @sFailureResponsePrefix            String        Prefix of the error message returned form the server during edit action
*/
(function ($) { "use strict";

    $.fn.makeEditable = function (options) {

        var iDisplayStart = 0;
        //Plugin options
        var properties;
        //Reuse i in all loops
        var i;

        function fnGetCellID(cell) {
            ///<summary>
            ///Utility function used to determine id of the cell
            ///By default it is assumed that id is placed as an id attribute of <tr> that that surround the cell (<td> tag). E.g.:
            ///<tr id="17">
            ///  <td>...</td><td>...</td><td>...</td><td>...</td>
            ///</tr>
            ///</summary>
            ///<param name="cell" type="DOM" domElement="true">TD cell refference</param>

            return properties.fnGetRowID($(cell.parentNode));
        }

        function _fnSetRowIDInAttribute(row, id, overwrite) {
            ///<summary>
            ///Utility function used to set id of the row. Usually when a new record is created, added to the table,
            ///and when id of the record is retrieved from the server-side.
            ///It is assumed that id is placed as an id attribute of <tr> that that surround the cell (<td> tag). E.g.:
            ///<tr id="17">
            ///  <td>...</td><td>...</td><td>...</td><td>...</td>
            ///</tr>
            ///This function is used when a datatable is configured in the server side processing mode or ajax source mode
            ///</summary>
            ///<param name="row" type="DOM" domElement="true">TR row where record is placed</param>

            if (overwrite) {
                row.attr("id", id);
            } else {
                if (row.attr("id") == null || row.attr("id") === "") {
                    row.attr("id", id);
                }
            }
        }

        function _fnGetRowIDFromAttribute(row) {
            ///<summary>
            ///Utility function used to get id of the row.
            ///It is assumed that id is placed as an id attribute of <tr> that that surround the cell (<td> tag). E.g.:
            ///<tr id="17">
            ///  <td>...</td><td>...</td><td>...</td><td>...</td>
            ///</tr>
            ///This function is used when a datatable is configured in the standard client side mode
            ///</summary>
            ///<param name="row" type="DOM" domElement="true">TR row where record is placed</param>
            ///<returns type="Number">Id of the row - by default id attribute placed in the TR tag</returns>

            return row.attr("id");
        }

        function _fnSetRowIDInFirstCell(row, id) {
            ///<summary>
            ///Utility function used to set id of the row. Usually when a new record is created, added to the table,
            ///and when id of the record is retrieved from the server-side).
            ///It is assumed that id is placed as a value of the first &lt;TD&gt; cell in the &lt;TR&gt;. As example:
            ///<tr>
            ///     <td>17</td><td>...</td><td>...</td><td>...</td>
            ///</tr>
            ///This function is used when a datatable is configured in the server side processing mode or ajax source mode
            ///</summary>
            ///<param name="row" type="DOM" domElement="true">TR row where record is placed</param>

            $("td:first", row).html(id);
        }


        function _fnGetRowIDFromFirstCell(row) {
            ///<summary>
            ///Utility function used to get id of the row.
            ///It is assumed that id is placed as a value of the first &lt;TD&gt; cell in the &lt;TR&gt;. As example:
            ///<tr>
            ///     <td>17</td><td>...</td><td>...</td><td>...</td>
            ///</tr>
            ///This function is used when a datatable is configured in the server side processing mode or ajax source mode
            ///</summary>
            ///<param name="row" type="DOM" domElement="true">TR row where record is placed</param>
            ///<returns type="Number">Id of the row - by default id attribute placed in the TR tag</returns>

            return $("td:first", row).html();

        }

        //Reference to the DataTable object
        var oTable;
        //Refences to the buttons used for manipulating table data
        var oAddNewRowButton, oDeleteRowButton, oConfirmRowAddingButton, oCancelRowAddingButton;
        //Reference to the form used for adding new data
        var oAddNewRowForm;

        function _fnShowError(errorText, action) {
            ///<summary>
            ///Shows an error message (Default function)
            ///</summary>
            ///<param name="errorText" type="String">text that should be shown</param>
            ///<param name="action" type="String"> action that was executed when error occured e.g. "update", "delete", or "add"</param>

            alert(errorText);
        }

        function _fnStartProcessingMode() {
            ///<summary>
            ///Function that starts "Processing" mode i.e. shows "Processing..." dialog while some action is executing(Default function)
            ///</summary>

            if (oTable.fnSettings().oFeatures.bProcessing) {
                $(".dataTables_processing").css("visibility", "visible");
            }
        }

        function _fnEndProcessingMode() {
            ///<summary>
            ///Function that ends the "Processing" mode and returns the table in the normal state(Default function)
            ///It shows processing message only if bProcessing setting is set to true
            ///</summary>

            if (oTable.fnSettings().oFeatures.bProcessing) {
                $(".dataTables_processing").css("visibility", "hidden");
            }
        }

        var sOldValue, sNewCellValue, sNewCellDisplayValue;

        var oSettings;
        function fnGetDisplayStart() {
            return oSettings._iDisplayStart;
        }


        function fnSetDisplayStart() {
            ///<summary>
            ///Set the pagination position(do nothing in the server-side mode)
            ///</summary>

            //To refresh table with preserver pagination on cell edit
            //if (oSettings.oFeatures.bServerSide === false) {
                oSettings._iDisplayStart = iDisplayStart;
                oSettings.oApi._fnCalculateEnd(oSettings);
                //draw the 'current' page
                oSettings.oApi._fnDraw(oSettings);
            //}
        }


        function fnApplyEditable(aoNodes) {
            ///<summary>
            ///Function that applies editable plugin to the array of table rows
            ///</summary>
            ///<param name="aoNodes" type="Array[TR]">Aray of table rows &lt;TR&gt; that should be initialized with editable plugin</param>

            if (properties.bDisableEditing) {
                return;
            }
            var oDefaultEditableSettings = {
                event: "dblclick",

                "onsubmit": function (settings, original) {
                    sOldValue = original.revert;
                    sNewCellValue = null;
                    sNewCellDisplayValue = null;
                    iDisplayStart = fnGetDisplayStart();

                    if(settings.type === "text" || settings.type === "select" || settings.type === "textarea" )
                    {
                        var input = $("input,select,textarea", this);
                        sNewCellValue = $("input,select,textarea", $(this)).val();
                        if (input.length === 1) {
                            var oEditElement = input[0];
                            if (oEditElement.nodeName.toLowerCase() === "select" || oEditElement.tagName.toLowerCase() === "select") {
                                sNewCellDisplayValue = $("option:selected", oEditElement).text(); //For select list use selected text instead of value for displaying in table
                            }
                            else {
                                sNewCellDisplayValue = sNewCellValue;
                            }
                        }

                        if (!properties.fnOnEditing(input, settings, original.revert, fnGetCellID(original))) {
                            return false;
                        }
                        var x = settings;

                        //2.2.2 INLINE VALIDATION
                        if (settings.oValidationOptions != null) {
                            input.parents("form").validate(settings.oValidationOptions);
                        }
                        if (settings.cssclass != null) {
                            input.addClass(settings.cssclass);
                        }
                        if(settings.cssclass == null && settings.oValidationOptions == null) {
                            return true;
                        }else{
                            if (!input.valid() || input.valid() === 0) {
                                return false;
                            }
                            else {
                                return true;
                            }
                        }

                    }

                    properties.fnStartProcessingMode();
                },
                "submitdata": function (value, settings) {
                    //iDisplayStart = fnGetDisplayStart();
                    //properties.fnStartProcessingMode();
                    var id = fnGetCellID(this);
                    var rowId = oTable.fnGetPosition(this)[0];
                    var columnPosition = oTable.fnGetPosition(this)[1];
                    var columnId = oTable.fnGetPosition(this)[2];
                    var sColumnName = oTable.fnSettings().aoColumns[columnId].sName;
                    if((sColumnName == null || sColumnName === "") && oTable.fnSettings().aoColumns[columnId].nTh.id !== "") {
                      sColumnName = oTable.fnSettings().aoColumns[columnId].nTh.id;
                    }
                    if (sColumnName == null || sColumnName === "") {
                        sColumnName = oTable.fnSettings().aoColumns[columnId].sTitle;
                    }
                    var updateData = null;
                    if (properties.aoColumns == null || properties.aoColumns[columnId] == null) {
                        updateData = $.extend({},
                                            properties.oUpdateParameters,
                                            {
                                                "id": id,
                                                "rowId": rowId,
                                                "columnPosition": columnPosition,
                                                "columnId": columnId,
                                                "columnName": sColumnName
                                            });
                    }
                    else {
                        updateData = $.extend({},
                                            properties.oUpdateParameters,
                                            properties.aoColumns[columnId].oUpdateParameters,
                                            {
                                                "id": id,
                                                "rowId": rowId,
                                                "columnPosition": columnPosition,
                                                "columnId": columnId,
                                                "columnName": sColumnName
                                            });
                    }
                    return updateData;
                },
                "callback": function (sValue, settings) {
                    properties.fnEndProcessingMode();
                    var status = "";
                    var aPos = oTable.fnGetPosition(this);

                    var bRefreshTable = !oSettings.oFeatures.bServerSide;
                    if($().modal) {
                        $("td.last-updated-cell", oTable.fnGetNodes( )).removeClass("info").removeClass("danger");
                    }
                    $("td.last-updated-cell", oTable.fnGetNodes( )).removeClass("last-updated-cell");
                    if(sValue.indexOf(properties.sFailureResponsePrefix) > -1) {
                        oTable.fnUpdate(sOldValue, aPos[0], aPos[2], bRefreshTable);
                        if($().modal) {
                            $("td.last-updated-cell", oTable).removeClass("info").removeClass("danger");
                            $(this).addClass("danger");
                        }
                        $("td.last-updated-cell", oTable).removeClass("last-updated-cell");
                        $(this).addClass("last-updated-cell");
                        properties.fnShowError(sValue.replace(properties.sFailureResponsePrefix, "").trim(), "update");
                        status = "failure";
                    } else {

                        if (properties.sSuccessResponse === "IGNORE" ||
                            (properties.aoColumns != null
                                && properties.aoColumns[aPos[2]] != null
                                && properties.aoColumns[aPos[2]].sSuccessResponse === "IGNORE") ||
                            (sNewCellValue == null) || (sNewCellValue === sValue) ||
                            properties.sSuccessResponse === sValue) {
                            if(sNewCellDisplayValue == null)
                            {
                                //sNewCellDisplayValue = sValue;
                                oTable.fnUpdate(sValue, aPos[0], aPos[2], bRefreshTable);
                            }else{
                                oTable.fnUpdate(sNewCellDisplayValue, aPos[0], aPos[2], bRefreshTable);
                            }
                            if($().modal) {
                                $("td.last-updated-cell", oTable).removeClass("info").removeClass("danger");
                                $(this).addClass("info");
                            }
                            $("td.last-updated-cell", oTable).removeClass("last-updated-cell");
                            $(this).addClass("last-updated-cell");
                            status = "success";
                        } else {
                            oTable.fnUpdate(sOldValue, aPos[0], aPos[2], bRefreshTable);
                            properties.fnShowError(sValue, "update");
                            status = "failure";
                        }
                    }

                    properties.fnOnEdited(status, sOldValue, sNewCellDisplayValue, aPos[0], aPos[1], aPos[2]);
                    if (settings.fnOnCellUpdated != null) {
                        settings.fnOnCellUpdated(status, sValue, aPos[0], aPos[2], settings);
                    }

                    fnSetDisplayStart();
                    if (properties.bUseKeyTable) {
                                var keys = oTable.keys;
                                /* Unblock KeyTable, but only after this 'esc' key event has finished. Otherwise
                                * it will 'esc' KeyTable as well
                                */
                                setTimeout(function () { keys.block = false; }, 0);
                            }
                },
                "onerror": function () {
                    properties.fnEndProcessingMode();
                    properties.fnShowError("Cell cannot be updated", "update");
                    properties.fnOnEdited("failure");
                },

                "onreset": function(){
                        if (properties.bUseKeyTable) {
                                var keys = oTable.keys;
                                /* Unblock KeyTable, but only after this 'esc' key event has finished. Otherwise
                                * it will 'esc' KeyTable as well
                                */
                                setTimeout(function () { keys.block = false; }, 0);
                            }

                },
                "height": properties.sEditorHeight,
                "width": properties.sEditorWidth
            };

            var cells = null;

            if (properties.aoColumns != null) {

                for (var iDTindex = 0, iDTEindex = 0; iDTindex < oSettings.aoColumns.length; iDTindex++) {
                    if (oSettings.aoColumns[iDTindex].bVisible) {//if DataTables column is visible
                        if (properties.aoColumns[iDTEindex] == null) {
                            //If editor for the column is not defined go to the next column
                            iDTEindex++;
                            continue;
                        }
                        //Get all cells in the iDTEindex column (nth child is 1-indexed array)
                        cells = $("td:nth-child(" + (iDTEindex + 1) + ")", aoNodes);

                        var oColumnSettings = oDefaultEditableSettings;
                        oColumnSettings = $.extend({}, oDefaultEditableSettings, properties.oEditableSettings, properties.aoColumns[iDTEindex]);
                        iDTEindex++;
                        var sUpdateURL = properties.sUpdateURL;
                        try {
                            if (oColumnSettings.sUpdateURL != null) {
                                sUpdateURL = oColumnSettings.sUpdateURL;
                            }
                        } catch (ex) {
                        }
                        //cells.editable(sUpdateURL, oColumnSettings);
                        cells.each(function () {
                            if (!$(this).hasClass(properties.sReadOnlyCellClass)) {
                                $(this).editable(sUpdateURL, oColumnSettings);
                            }
                        });
                    }

                } //end for
            } else {
                cells = $("td:not(." + properties.sReadOnlyCellClass + ")", aoNodes);
                cells.editable(properties.sUpdateURL, $.extend({}, oDefaultEditableSettings, properties.oEditableSettings));
            }
        }function fnTakeRowDataFromFormElements(oForm) {
            ///<summary>Populates row with form elements(This should be nly function that read fom elements from form)</summary>
            ///<param name="iRowID" type="DOM">DatabaseRowID</param>
            ///<param name="oForm" type="DOM">Form used to enter data</param>
            ///<returns>Object or array</returns>

            var iDT_RowId = jQuery.data(oForm, "DT_RowId");
            var iColumnCount = oSettings.aoColumns.length;

            var values = new Array();
            var rowData = new Object();

            $("input:text[rel],input:radio[rel][checked],input:hidden[rel],select[rel],textarea[rel],span.datafield[rel],input:checkbox[rel]", oForm).each(function () {
                var rel = $(this).attr("rel");
                var sCellValue = "";
                if (rel >= iColumnCount) {
                    properties.fnShowError("In the add form is placed input element with the name '" + $(this).attr("name") + "' with the 'rel' attribute that must be less than a column count - " + iColumnCount, "add");
                }
                else {
                    if (this.nodeName.toLowerCase() === "select" || this.tagName.toLowerCase() === "select") {
                        //sCellValue = $("option:selected", this).text();
                        sCellValue = $.map(
                                             $.makeArray($("option:selected", this)),
                                             function (n) {
                                                 return $(n).text();
                                             }).join(",");
                    }
                    else if (this.nodeName.toLowerCase() === "span" || this.tagName.toLowerCase() === "span") {
                        sCellValue = $(this).html();
                    }
                    else {
                        if (this.type === "checkbox") {
                            if (this.checked) {
                                sCellValue = (this.value !== "on") ? this.value : "true";
                            }
                            else {
                                sCellValue = (this.value !== "on") ? "" : "false";
                            }
                        } else {
                            sCellValue = this.value;
                        }
                    }
                    //Deprecated
                    sCellValue = sCellValue.replace("DATAROWID", iDT_RowId);
                    sCellValue = sCellValue.replace(properties.sIDToken, iDT_RowId);
                    /**
                     *  ISSUE COPIED FROM ISSUES IN ORIGINAL PROJECT
                     *  https://code.google.com/p/jquery-datatables-editable/issues/attachmentText?id=114&aid=1140008000&name=fixAddData.diff&token=ABZ6GAdDl4DrChcFNZgyElwt_2z3PWs3OQ%3A1426877135207
                     */

                    var prop = oSettings.aoColumns[0].mDataProp !== undefined ? oSettings.aoColumns[0].mDataProp : oSettings.aoColumns[0].mData; // ++

                    if (oSettings.aoColumns != null
                                && oSettings.aoColumns[rel] != null
                    //          && isNaN(parseInt(oSettings.aoColumns[0].mDataProp))) {
                                && isNaN(parseInt(prop))) { // ++
                        rowData[oSettings.aoColumns[rel].mDataProp] = sCellValue;
                    } else {
                        values[rel] = sCellValue;
                    }
                }
            });
            /**
             *  ISSUE COPIED FROM ISSUES IN ORIGINAL PROJECT
             *  https://code.google.com/p/jquery-datatables-editable/issues/attachmentText?id=114&aid=1140008000&name=fixAddData.diff&token=ABZ6GAdDl4DrChcFNZgyElwt_2z3PWs3OQ%3A1426877135207
             */
            // -- if (oSettings.aoColumns != null && isNaN(parseInt(oSettings.aoColumns[0].mDataProp))) {
            var prop = oSettings.aoColumns[0].mDataProp !== undefined ? oSettings.aoColumns[0].mDataProp : oSettings.aoColumns[0].mData; // ++
            if (oSettings.aoColumns != null && isNaN(parseInt(prop))) { // ++
                return rowData;
            }
            else {
                return values;
            }


        } //End function fnTakeRowDataFromFormElements


        function fnOnRowAdded(data) {
            ///<summary>
            ///Function that is called when a new row is added, and Ajax response is returned from server
            /// This function takes data from the add form and adds them into the table.
            ///</summary>
            ///<param name="data" type="int">Id of the new row that is returned from the server</param>

            properties.fnEndProcessingMode();

            if (properties.fnOnNewRowPosted(data)) {

                var oSettings = oTable.fnSettings();
                if (!oSettings.oFeatures.bServerSide) {
                    jQuery.data(oAddNewRowForm, "DT_RowId", data);
                    var values = fnTakeRowDataFromFormElements(oAddNewRowForm);


                    var rtn;
                    //Add values from the form into the table
                    /**
                     *  ISSUE COPIED FROM ISSUES IN ORIGINAL PROJECT
                     *  https://code.google.com/p/jquery-datatables-editable/issues/attachmentText?id=114&aid=1140008000&name=fixAddData.diff&token=ABZ6GAdDl4DrChcFNZgyElwt_2z3PWs3OQ%3A1426877135207
                     */
                    // -- if (oSettings.aoColumns != null && isNaN(parseInt(oSettings.aoColumns[0].mDataProp))) {
                    // --   rtn = oTable.fnAddData(rowData);
                    var prop = oSettings.aoColumns[0].mDataProp !== undefined ? oSettings.aoColumns[0].mDataProp : oSettings.aoColumns[0].mData; // ++
                    if (oSettings.aoColumns != null && isNaN(parseInt(prop))) { // ++
                        rtn = oTable.fnAddData(data); // ++
                    }
                    else {
                        rtn = oTable.fnAddData(values);
                    }

                    var oTRAdded = oTable.fnGetNodes(rtn);
                    //add id returned by server page as an TR id attribute
                    properties.fnSetRowID($(oTRAdded), data, true);
                    //Apply editable plugin on the cells of the table
                    fnApplyEditable(oTRAdded);

                    if($().modal) {
                        $("tr.last-added-row", oTable).removeClass("success");
                        $(oTRAdded).addClass("success");
                    }
                    $("tr.last-added-row", oTable).removeClass("last-added-row");
                    $(oTRAdded).addClass("last-added-row");
                } /*else {
                    oTable.fnDraw(false);
                }*/
                //Close the dialog
                if(jQuery.ui) {
                    oAddNewRowForm.dialog("close");
                } else if($().modal) {
                    $("#addModal").modal("hide");
                }
                $(oAddNewRowForm)[0].reset();
                $(".error", $(oAddNewRowForm)).html("");

                fnSetDisplayStart();
                properties.fnOnAdded("success");
                                    if (properties.bUseKeyTable) {
                                var keys = oTable.keys;
                                /* Unblock KeyTable, but only after this 'esc' key event has finished. Otherwise
                                * it will 'esc' KeyTable as well
                                */
                                setTimeout(function () { keys.block = false; }, 0);
                            }
            }
        }


        function fnOnRowAdding(event) {
            ///<summary>
            ///Event handler called when a user click on the submit button in the "Add new row" form.
            ///</summary>
            ///<param name="event">Event that caused the action</param>

            if (properties.fnOnAdding()) {
                if (oAddNewRowForm.valid()) {
                    iDisplayStart = fnGetDisplayStart();
                    properties.fnStartProcessingMode();

                    if (properties.bUseFormsPlugin) {
                        //Still in beta(development)
                        $(oAddNewRowForm).ajaxSubmit({
                            dataType: "xml",
                            success: function (response, statusString, xhr) {
                                if (xhr.responseText.toLowerCase().indexOf("error") !== -1) {
                                    properties.fnEndProcessingMode();
                                    properties.fnShowError(xhr.responseText.replace("Error", ""), "add");
                                    properties.fnOnAdded("failure");
                                } else {
                                    fnOnRowAdded(xhr.responseText);
                                }

                            },
                            error: function (response) {
                                properties.fnEndProcessingMode();
                                properties.fnShowError(response.responseText, "add");
                                properties.fnOnAdded("failure");
                            }
                        }
                        );

                    } else {
//                         var params_info = oAddNewRowForm["info"];
                        
                        var params = oAddNewRowForm.serialize();
//                         params = params.replace(/%22/g, '\%22');
//                         var paramss = $(oAddNewRowForm).html();
//                         alert(paramss);
                        
//                         const getCircularReplacer = () => {
//                             const seen = new WeakSet();
//                             return (key, value) => {
//                                 if (typeof value === "object" && value !== null) {
//                                 if (seen.has(value)) {
//                                     return;
//                                 }
//                                 seen.add(value);
//                                 }
//                                 return value;
//                             };
//                             };
// 
//                            var paramss =  JSON.stringify(oAddNewRowForm, getCircularReplacer());
//                             alert(paramss);
                        
                        $.ajax({ "url": properties.sAddURL,
                            "data": params,
                            "type": properties.sAddHttpMethod,
                            "dataType": properties.sAddDataType,
                            success: fnOnRowAdded,
                            error: function (response) {
                                properties.fnEndProcessingMode();
                                properties.fnShowError(response.responseText, "add");
                                properties.fnOnAdded("failure");
                            }
                        });
                    }
                }
            }
            event.stopPropagation();
            event.preventDefault();
        }

        function _fnOnNewRowPosted(data) {
            ///<summary>Callback function called BEFORE a new record is posted to the server</summary>
            ///TODO: Check this

            return true;
        }


        function fnOnCancelRowAdding(event) {
            ///<summary>
            ///Event handler function that is executed when a user press cancel button in the add new row form
            ///This function clean the add form and error messages if some of them are shown
            ///</summary>
            ///<param name="event" type="int">DOM event that caused an error</param>

            //Clear the validation messages and reset form
            $(oAddNewRowForm).validate().resetForm();  // Clears the validation errors
            $(oAddNewRowForm)[0].reset();

            $(".error", $(oAddNewRowForm)).html("");
            $(".error", $(oAddNewRowForm)).hide();  // Hides the error element

            //Close the dialog
            oAddNewRowForm.dialog("close");
            event.stopPropagation();
            event.preventDefault();
        }


        function fnDisableDeleteButton() {
            ///<summary>
            ///Function that disables delete button
            ///</summary>

           if (properties.bUseKeyTable) {
                return;
            }
            if (properties.oDeleteRowButtonOptions != null) {
                if(jQuery.ui) {
                    oDeleteRowButton.button("option", "disabled", true);
                } else {
                    oDeleteRowButton.button().addClass("disabled");
                }
            } else {
                oDeleteRowButton.attr("disabled", "true");
            }
        }

        function fnEnableDeleteButton() {
            ///<summary>
            ///Function that enables delete button
            ///</summary>

            if (properties.oDeleteRowButtonOptions != null) {
                if(jQuery.ui) {
                    oDeleteRowButton.button("option", "disabled", false);
                } else {
                    oDeleteRowButton.button().removeClass("disabled");
                }
            } else {
                oDeleteRowButton.removeAttr("disabled");
            }
        }

        var nSelectedRow, nSelectedCell, jSelectedRow;
        var oKeyTablePosition;


        function fnOnRowDeleted(response) {
            ///<summary>
            ///Called after the record is deleted on the server (in the ajax success callback)
            ///</summary>
            ///<param name="response" type="String">Response text eturned from the server-side page</param>

            properties.fnEndProcessingMode();
            var oTRSelected = nSelectedRow;
/*
            if (!properties.bUseKeyTable) {
                oTRSelected = $('tr.' + properties.sSelectedRowClass, oTable)[0];
            } else {
                oTRSelected = $("td.focus", oTable)[0].parents("tr")[0];
            }
            */
            if (response === properties.sSuccessResponse || response === "") {
                oTable.fnDeleteRow(oTRSelected);
                fnDisableDeleteButton();
                fnSetDisplayStart();
                if (properties.bUseKeyTable) {
                    oTable.keys.fnSetPosition( oKeyTablePosition[0], oKeyTablePosition[1] );
                }
                properties.fnOnDeleted("success");
            }
            else {
                properties.fnShowError(response, "delete");
                properties.fnOnDeleted("failure");
            }
        }


        function fnDeleteRow(id, sDeleteURL) {
            ///<summary>
            ///Function that deletes a row with an id, using the sDeleteURL server page
            ///</summary>
            ///<param name="id" type="int">Id of the row that will be deleted. Id value is placed in the attribute of the TR tag that will be deleted</param>
            ///<param name="sDeleteURL" type="String">Server URL where delete request will be posted</param>

            var sURL = sDeleteURL;
            if (sDeleteURL == null) {
                sURL = properties.sDeleteURL;
            }
            properties.fnStartProcessingMode();
            var data = $.extend(properties.oDeleteParameters, { "id": id });
            $.ajax({ "url": sURL,
                "type": properties.sDeleteHttpMethod,
                "data": data,
                "success": fnOnRowDeleted,
                "dataType": properties.sDeleteDataType,
                "error": function (response) {
                    properties.fnEndProcessingMode();
                    properties.fnShowError(response.responseText, "delete");
                    properties.fnOnDeleted("failure");

                }
            });
        }


        function _fnOnRowDeleteInline(e) {

            var sURL = $(this).attr("href");
            if (sURL == null || sURL === "") {
                sURL = properties.sDeleteURL;
            }

            e.preventDefault();
            e.stopPropagation();

            iDisplayStart = fnGetDisplayStart();

            nSelectedCell = ($(this).parents("td"))[0];
            jSelectedRow = ($(this).parents("tr"));
            nSelectedRow = jSelectedRow[0];

            jSelectedRow.addClass(properties.sSelectedRowClass);

            var id = fnGetCellID(nSelectedCell);
            if (properties.fnOnDeleting(jSelectedRow, id, fnDeleteRow)) {
                fnDeleteRow(id, sURL);
            }
        }


        function _fnDisableDeleteButton() {
            // oDeleteRowButton.attr("disabled", "true"); ?
            return; // Function didn't exist
        }


        function _fnOnRowDelete(event) {
            ///<summary>
            ///Event handler for the delete button
            ///</summary>
            ///<param name="event" type="Event">DOM event</param>

            event.preventDefault();
            event.stopPropagation();

            iDisplayStart = fnGetDisplayStart();

            nSelectedRow = null;
            nSelectedCell = null;

            if (!properties.bUseKeyTable) {
                if ($("tr." + properties.sSelectedRowClass + " td", oTable).length === 0) {
                    //oDeleteRowButton.attr("disabled", "true");
                    _fnDisableDeleteButton();
                    return;
                }
                nSelectedCell = $("tr." + properties.sSelectedRowClass + " td", oTable)[0];
            } else {
                nSelectedCell = $("td.focus", oTable)[0];

            }
            if (nSelectedCell == null) {
                fnDisableDeleteButton();
                return;
            }
            if (properties.bUseKeyTable) {
                oKeyTablePosition = oTable.keys.fnGetCurrentPosition();
            }
            var id = fnGetCellID(nSelectedCell);
            jSelectedRow = $(nSelectedCell).parent("tr");
            nSelectedRow = jSelectedRow[0];
            if (properties.fnOnDeleting(jSelectedRow, id, fnDeleteRow)) {
                fnDeleteRow(id);
            }
        }

        function _fnOnDeleting(tr, id, fnDeleteRow) {
            ///<summary>
            ///The default function that is called before row is deleted
            ///Returning false will abort delete
            ///Function can be overriden via plugin properties in order to create custom delete functionality
            ///in that case call fnDeleteRow with parameter id, and return false to prevent double delete action
            ///</summary>
            ///<param name="tr" type="JQuery">JQuery wrapper around the TR tag that will be deleted</param>
            ///<param name="id" type="String">Id of the record that wil be deleted</param>
            ///<param name="fnDeleteRow" type="Function(id)">Function that will be called to delete a row. Default - fnDeleteRow(id)</param>

            return confirm("Are you sure that you want to delete this record?");
        }


        /* Function called after delete action
        * @param    result  string
        *           "success" if row is actually deleted
        *           "failure" if delete failed
        * @return   void
        */
        function _fnOnDeleted(result) { }

        function _fnOnEditing(input) { return true; }
        function _fnOnEdited(result, sOldValue, sNewValue, iRowIndex, iColumnIndex, iRealColumnIndex) {

        }

        function fnOnAdding() { return true; }
        function _fnOnAdded(result) { }

        function _fnOnBeforeAction(sAction) {
            return true;
        }

        function _fnOnActionCompleted(sStatus) {

        }

        function fnGetActionSettings(sAction) {
            ///<summary>Returns settings object for the action</summary>
            ///<param name="sAction" type="String">The name of the action</param>

            if (properties.aoTableAction) {
                properties.fnShowError("Configuration error - aoTableAction setting are not set", sAction);
            }

            for (i = 0; i < properties.aoTableActions.length; i++) {
                if (properties.aoTableActions[i].sAction === sAction) {
                    return properties.aoTableActions[i];
                }
            }

            properties.fnShowError("Cannot find action configuration settings", sAction);
        }


        function fnPopulateFormWithRowCells(oForm, oTR) {
            ///<summary>Populates forms with row data</summary>
            ///<param name="oForm" type="DOM">Form used to enter data</param>
            ///<param name="oTR" type="DOM">Table Row that will populate data</param>

            var iRowID = oTable.fnGetPosition(oTR);

            var id = properties.fnGetRowID($(oTR));

            $(oForm).validate().resetForm();
            jQuery.data($(oForm)[0], "DT_RowId", id);
            $("input.DT_RowId", $(oForm)).val(id);
            jQuery.data($(oForm)[0], "ROWID", iRowID);
            $("input.ROWID", $(oForm)).val(iRowID);


            var oSettings = oTable.fnSettings();
            var iColumnCount = oSettings.aoColumns.length;


            $("input:text[rel],input:radio[rel][checked],input:hidden[rel],select[rel],textarea[rel],input:checkbox[rel]",
                                    $(oForm)).each(function () {
                                        var rel = $(this).attr("rel");

                                        if (rel >= iColumnCount) {
                                            properties.fnShowError("In the form is placed input element with the name '" + $(this).attr("name") + "' with the 'rel' attribute that must be less than a column count - " + iColumnCount, "action");
                                        }
                                        else {
                                            var sCellValue = oTable.fnGetData(oTR)[rel];
                                            if (this.nodeName.toLowerCase() === "select" || this.tagName.toLowerCase() === "select") {

                                                if (this.multiple === true) {
                                                    var aoSelectedValue = new Array();
                                                    var aoCellValues = sCellValue.split(",");

                                                    for (i = 0; i <= this.options.length - 1; i++) {
                                                        if (jQuery.inArray(this.options[i].text.toLowerCase().trim(), aoCellValues) !== -1) {
                                                             aoSelectedValue.push(this.options[i].value);
                                                        }
                                                     }
                                                     $(this).val(aoSelectedValue);
                                                } else {
                                                    for (i = 0; i <= this.options.length - 1; i++) {
                                                        if (this.options[i].text.toLowerCase() === sCellValue.toLowerCase()) {
                                                                $(this).val(this.options[i].value);
                                                        }
                                                    }
                                                }

                                            }
                                            else if (this.nodeName.toLowerCase() === "span" || this.tagName.toLowerCase() === "span") {
                                                $(this).html(sCellValue);
                                            }
                                            else {
                                                if (this.type === "checkbox") {
                                                    if (sCellValue === "true") {
                                                        $(this).attr("checked", true);
                                                    }
                                                } else {
                                                    if (this.type === "radio") {
                                                        if (this.value === sCellValue) {
                                                            this.checked = true;
                                                        }
                                                    } else {
                                                        this.value = sCellValue;
                                                    }
                                                }
                                            }

                                            //sCellValue = sCellValue.replace(properties.sIDToken, data);
                                            //values[rel] = sCellValue;
                                            //oTable.fnUpdate(sCellValue, iRowID, rel);
                                        }
                                    });



        } //End function fnPopulateFormWithRowCells

        function fnUpdateRowOnSuccess(nActionForm) {
            ///<summary>Updates table row using  form fields after the ajax success callback is executed</summary>
            ///<param name="nActionForm" type="DOM">Form used to enter data</param>

            var values = fnTakeRowDataFromFormElements(nActionForm);

            var iRowID = jQuery.data(nActionForm, "ROWID");
            var oSettings = oTable.fnSettings();
            var iColumnCount = oSettings.aoColumns.length;
            var sCellValue;
            for (var rel = 0; rel < iColumnCount; rel++) {
                sCellValue = undefined;
                if (oSettings.aoColumns != null
                                && oSettings.aoColumns[rel] != null
                                && isNaN(parseInt(oSettings.aoColumns[0].mDataProp))) {
                    sCellValue = rowData[oSettings.aoColumns[rel].mDataProp];
                } else {
                    sCellValue = values[rel];
                }
                if (sCellValue !== undefined) {
                    oTable.fnUpdate(sCellValue, iRowID, rel);
                }
            }

            fnSetDisplayStart();
            $(nActionForm).dialog("close");
            return;

        }


        function fnSendFormUpdateRequest(nActionForm) {
            ///<summary>Updates table row using  form fields</summary>
            ///<param name="nActionForm" type="DOM">Form used to enter data</param>

            var jActionForm = $(nActionForm);
            var sAction = jActionForm.attr("id");

            sAction = sAction.replace("form", "");
            var sActionURL = jActionForm.attr("action");
            if (properties.fnOnBeforeAction(sAction)) {
                if (jActionForm.valid()) {
                    iDisplayStart = fnGetDisplayStart();
                    properties.fnStartProcessingMode();
                    if (properties.bUseFormsPlugin) {

                        //Still in beta(development)
                        var oAjaxSubmitOptions = {
                            success: function (response, statusString, xhr) {
                                properties.fnEndProcessingMode();
                                if (response.toLowerCase().indexOf("error") !== -1 || statusString !== "success") {
                                    properties.fnShowError(response, sAction);
                                    properties.fnOnActionCompleted("failure");
                                } else {
                                    fnUpdateRowOnSuccess(nActionForm);
                                    properties.fnOnActionCompleted("success");
                                }

                            },
                            error: function (response) {
                                properties.fnEndProcessingMode();
                                properties.fnShowError(response.responseText, sAction);
                                properties.fnOnActionCompleted("failure");
                            }
                        };
                        var oActionSettings = fnGetActionSettings(sAction);
                        oAjaxSubmitOptions = $.extend({}, properties.oAjaxSubmitOptions, oAjaxSubmitOptions);
                        $(oActionForm).ajaxSubmit(oAjaxSubmitOptions);

                    } else {
                        var params = jActionForm.serialize();
                        $.ajax({ "url": sActionURL,
                            "data": params,
                            "type": properties.sAddHttpMethod,
                            "dataType": properties.sAddDataType,
                            success: function (response) {
                                properties.fnEndProcessingMode();
                                fnUpdateRowOnSuccess(nActionForm);
                                properties.fnOnActionCompleted("success");
                            },
                            error: function (response) {
                                properties.fnEndProcessingMode();
                                properties.fnShowError(response.responseText, sAction);
                                properties.fnOnActionCompleted("failure");
                            }
                        });
                    }
                }
            }
        }


        oTable = this;

        var defaults = {

            sUpdateURL: "UpdateData",
            sAddURL: "AddData",
            sDeleteURL: "DeleteData",
            sAddNewRowFormId: "formAddNewRow",
            oAddNewRowFormOptions: { autoOpen: false, modal: true },
            sAddNewRowButtonId: "btnAddNewRow",
            oAddNewRowButtonOptions: null,
            sAddNewRowOkButtonId: "btnAddNewRowOk",
            sAddNewRowCancelButtonId: "btnAddNewRowCancel",
            oAddNewRowOkButtonOptions: { label: "Ok" },
            oAddNewRowCancelButtonOptions: { label: "Cancel" },
            sDeleteRowButtonId: "btnDeleteRow",
            oDeleteRowButtonOptions: null,
            sSelectedRowClass: (jQuery.ui ? "row_selected" : "active"),
            sReadOnlyCellClass: "read_only",
            sAddDeleteToolbarSelector: ".add_delete_toolbar",
            fnShowError: _fnShowError,
            fnStartProcessingMode: _fnStartProcessingMode,
            fnEndProcessingMode: _fnEndProcessingMode,
            aoColumns: null,
            fnOnDeleting: _fnOnDeleting,
            fnOnDeleted: _fnOnDeleted,
            fnOnAdding: fnOnAdding,
            fnOnNewRowPosted: _fnOnNewRowPosted,
            fnOnAdded: _fnOnAdded,
            fnOnEditing: _fnOnEditing,
            fnOnEdited: _fnOnEdited,
            sAddHttpMethod: "POST",
            sAddDataType: "text",
            sDeleteHttpMethod: "POST",
            sDeleteDataType: "text",
            fnGetRowID: _fnGetRowIDFromAttribute,
            fnSetRowID: _fnSetRowIDInAttribute,
            sEditorHeight: "100%",
            sEditorWidth: "100%",
            bDisableEditing: false,
            oDeleteParameters: {},
            oUpdateParameters: {},
            sIDToken: "DT_RowId",
            aoTableActions: null,
            fnOnBeforeAction: _fnOnBeforeAction,
            bUseFormsPlugin: false,
            fnOnActionCompleted: _fnOnActionCompleted,
            sSuccessResponse: "ok",
        sFailureResponsePrefix: "ERROR",
            oKeyTable: null        //KEYTABLE

        };

        properties = $.extend(defaults, options);
        oSettings = oTable.fnSettings();
        properties.bUseKeyTable = (properties.oKeyTable != null);

        return this.each(function () {
            var sTableId = oTable.dataTableSettings[0].sTableId;
            //KEYTABLE
            if (properties.bUseKeyTable) {
                var keys = new KeyTable({
                    "table": document.getElementById(sTableId),
                    "datatable": oTable
                });
                oTable.keys = keys;

                /* Apply a return key event to each cell in the table */
                keys.event.action(null, null, function (nCell) {
                    if( $(nCell).hasClass(properties.sReadOnlyCellClass)) {
                        return;
                    }
                    /* Block KeyTable from performing any events while jEditable is in edit mode */
                    keys.block = true;
                    /* Dispatch click event to go into edit mode - Saf 4 needs a timeout... */
                    setTimeout(function () { $(nCell).dblclick(); }, 0);
                    //properties.bDisableEditing = true;
                });
            }






            //KEYTABLE

            if (oTable.fnSettings().sAjaxSource != null) {
                oTable.fnSettings().aoDrawCallback.push({
                    "fn": function () {
                        //Apply jEditable plugin on the table cells
                        fnApplyEditable(oTable.fnGetNodes());
                        $(oTable.fnGetNodes()).each(function () {
                            var position = oTable.fnGetPosition(this);
                            var id = oTable.fnGetData(position)[0];
                            properties.fnSetRowID($(this), id);
                        }
                        );
                    },
                    "sName": "fnApplyEditable"
                });

            } else {
                //Apply jEditable plugin on the table cells
                fnApplyEditable(oTable.fnGetNodes());
            }

            //Setup form to open in dialog
            oAddNewRowForm = $("#" + properties.sAddNewRowFormId);
            if (oAddNewRowForm.length !== 0) {

                ///Check does the add new form has all nessecary fields
                var oSettings = oTable.fnSettings();
                var iColumnCount = oSettings.aoColumns.length;
                for (i = 0; i < iColumnCount; i++) {
                    if ($("[rel=" + i + "]", oAddNewRowForm).length === 0) {
                        properties.fnShowError("In the form that is used for adding new records cannot be found an input element with rel=" + i + " that will be bound to the value in the column " + i + ". See http://code.google.com/p/jquery-datatables-editable/wiki/AddingNewRecords#Add_new_record_form for more details", "init");
                    }
                }


                if (properties.oAddNewRowFormOptions != null) {
                    properties.oAddNewRowFormOptions.autoOpen = false;
                } else {
                    properties.oAddNewRowFormOptions = { autoOpen: false };
                }
                if(jQuery.ui) {
                    oAddNewRowForm.dialog(properties.oAddNewRowFormOptions);
                }

                //Add button click handler on the "Add new row" button
                oAddNewRowButton = $("#" + properties.sAddNewRowButtonId);
                if (oAddNewRowButton.length !== 0) {

                        if(oAddNewRowButton.data("add-event-attached") !== "true")
                        {
                            oAddNewRowButton.click(function () {
                                if(jQuery.ui) {
                                    oAddNewRowForm.dialog("open");
                                } else if($().modal) {
                                    $("#addModal").modal("show");
                                }
                            });
                            oAddNewRowButton.data("add-event-attached", "true");
                        }

                } else {
                    if ($(properties.sAddDeleteToolbarSelector).length === 0) {
                        throw "Cannot find a button with an id '" + properties.sAddNewRowButtonId + "', or placeholder with an id '" + properties.sAddDeleteToolbarSelector + "' that should be used for adding new row although form for adding new record is specified";
                    } else {
                        oAddNewRowButton = null; //It will be auto-generated later
                    }
                }

                //Prevent Submit handler
                if (oAddNewRowForm[0].nodeName.toLowerCase() === "form") {
                    oAddNewRowForm.unbind("submit");
                    oAddNewRowForm.submit(function (event) {
                        fnOnRowAdding(event);
                        return false;
                    });
                } else {
                    $("form", oAddNewRowForm[0]).unbind("submit");
                    $("form", oAddNewRowForm[0]).submit(function (event) {
                        fnOnRowAdding(event);
                        return false;
                    });
                }

                // array to add default buttons to
                var aAddNewRowFormButtons = [];

                oConfirmRowAddingButton = $("#" + properties.sAddNewRowOkButtonId, oAddNewRowForm);
                if (oConfirmRowAddingButton.length === 0) {
                    //If someone forgotten to set the button text
                    if (properties.oAddNewRowOkButtonOptions.text == null
                        || properties.oAddNewRowOkButtonOptions.text === "") {
                        properties.oAddNewRowOkButtonOptions.text = "Ok";
                    }
                    properties.oAddNewRowOkButtonOptions.click = fnOnRowAdding;
                    properties.oAddNewRowOkButtonOptions.id = properties.sAddNewRowOkButtonId;
                    // push the add button onto the array
                    aAddNewRowFormButtons.push(properties.oAddNewRowOkButtonOptions);
                } else {
                    oConfirmRowAddingButton.click(fnOnRowAdding);
                }

                oCancelRowAddingButton = $("#" + properties.sAddNewRowCancelButtonId);
                if (oCancelRowAddingButton.length === 0) {
                    //If someone forgotten to the button text
                    if (properties.oAddNewRowCancelButtonOptions.text == null
                        || properties.oAddNewRowCancelButtonOptions.text === "") {
                        properties.oAddNewRowCancelButtonOptions.text = "Cancel";
                    }
                    properties.oAddNewRowCancelButtonOptions.click = fnOnCancelRowAdding;
                    properties.oAddNewRowCancelButtonOptions.id = properties.sAddNewRowCancelButtonId;
                    // push the cancel button onto the array
                    aAddNewRowFormButtons.push(properties.oAddNewRowCancelButtonOptions);
                } else {
                    oCancelRowAddingButton.click(fnOnCancelRowAdding);
                }
                // if the array contains elements, add them to the dialog
                if (jQuery.ui && aAddNewRowFormButtons.length > 0) {
                    oAddNewRowForm.dialog("option", "buttons", aAddNewRowFormButtons);
                }
                //Issue: It cannot find it with this call:
                //oConfirmRowAddingButton = $("#" + properties.sAddNewRowOkButtonId, oAddNewRowForm);
                //oCancelRowAddingButton = $("#" + properties.sAddNewRowCancelButtonId, oAddNewRowForm);
                oConfirmRowAddingButton = $("#" + properties.sAddNewRowOkButtonId);
                oCancelRowAddingButton = $("#" + properties.sAddNewRowCancelButtonId);

                if (properties.oAddNewRowFormValidation != null) {
                    oAddNewRowForm.validate(properties.oAddNewRowFormValidation);
                    }
            } else {
                oAddNewRowForm = null;
            }

            //Set the click handler on the "Delete selected row" button
            oDeleteRowButton = $("#" + properties.sDeleteRowButtonId);
            if (oDeleteRowButton.length !== 0)
            {
                if(oDeleteRowButton.data("delete-event-attached") !== "true")
                {
                    oDeleteRowButton.click(_fnOnRowDelete);
                    oDeleteRowButton.data("delete-event-attached", "true");
                }
            }
            else {
                oDeleteRowButton = null;
            }

            //If an add and delete buttons does not exists but Add-delete toolbar is specificed
            //Autogenerate these buttons
            var oAddDeleteToolbar = $(properties.sAddDeleteToolbarSelector);
            if (oAddDeleteToolbar.length !== 0) {
                if (oAddNewRowButton == null && properties.sAddNewRowButtonId !== ""
                    && oAddNewRowForm != null) {
                    oAddDeleteToolbar.append("<button id='" + properties.sAddNewRowButtonId + "' class='add_row'> Добавить</button>");
                    oAddNewRowButton = $("#" + properties.sAddNewRowButtonId);
                    oAddNewRowButton.click(function () {
                        if(jQuery.ui) {
                            oAddNewRowForm.dialog("open");
                        }
                    });
                }
                if (oDeleteRowButton == null && properties.sDeleteRowButtonId !== "") {
                    oAddDeleteToolbar.append("<button id='" + properties.sDeleteRowButtonId + "' class='delete_row'> Удалить</button>");
                    oDeleteRowButton = $("#" + properties.sDeleteRowButtonId);
                    oDeleteRowButton.click(_fnOnRowDelete);
                }
            }

            //If delete button exists disable it until some row is selected
            if (oDeleteRowButton != null && properties.oDeleteRowButtonOptions != null) {
                // If using jQuery-UI
                if(jQuery.ui) {
                    oDeleteRowButton.button(properties.oDeleteRowButtonOptions);
                // If using Bootstrap and there are icons/classes specified
                } else if(properties.oDeleteRowButtonOptions.icons) {
                    oDeleteRowButton.button().addClass("btn " + properties.oDeleteRowButtonOptions.icons.primary);
                }
                fnDisableDeleteButton();
            }

            //If add button exists convert it to the JQuery-ui button
            if (oAddNewRowButton != null && properties.oAddNewRowButtonOptions != null) {
                // If using jQuery-UI
                if(jQuery.ui) {
                    oAddNewRowButton.button(properties.oAddNewRowButtonOptions);
                // If using Bootstrap and there are icons/classes specified
                } else if(properties.oAddNewRowButtonOptions.icons) {
                    oAddNewRowButton.button().addClass("btn " + properties.oAddNewRowButtonOptions.icons.primary).on("click", function() { $("#addModal").modal(); });
                }
            }


            //If form ok button exists convert it to the JQuery-ui button
            if (oConfirmRowAddingButton != null && properties.oAddNewRowOkButtonOptions != null) {
                // If using jQuery-UI
                if(jQuery.ui) {
                    oConfirmRowAddingButton.button(properties.oAddNewRowOkButtonOptions);
                // If using Bootstrap and there are icons/classes specified
                } else if (properties.oAddNewRowOkButtonOptions.icons) {
                    oConfirmRowAddingButton.button().addClass("btn " + properties.oAddNewRowOkButtonOptions.icons.primary).on("click", function() { $("#confirmModal").modal(); });
                }
            }

            //If form cancel button exists convert it to the JQuery-ui button
            if (oCancelRowAddingButton != null && properties.oAddNewRowCancelButtonOptions != null) {
                // If using jQuery-UI
                if(jQuery.ui) {
                    oCancelRowAddingButton.button(properties.oAddNewRowCancelButtonOptions);
                // If using Bootstrap and there are icons/classes specified
                } else if(properties.oAddNewRowCancelButtonOptions.icons) {
                    oCancelRowAddingButton.button().addClass("btn " + properties.oAddNewRowCancelButtonOptions.icons.primary).on("click", function() { $("#cancelModal").modal(); });
                }
            }

            //Add handler to the inline delete buttons
            $(".table-action-deletelink", oTable).on("click", _fnOnRowDeleteInline);

            if (!properties.bUseKeyTable) {
            //Set selected class on row that is clicked
            //Enable delete button if row is selected, disable delete button if selected class is removed
            $("tbody", oTable).click(function (event) {
                if ($(event.target.parentNode).hasClass(properties.sSelectedRowClass)) {
                    $(event.target.parentNode).removeClass(properties.sSelectedRowClass);
                    if (oDeleteRowButton != null) {
                        fnDisableDeleteButton();
                    }
                } else {
                    $(oTable.fnSettings().aoData).each(function () {
                        $(this.nTr).removeClass(properties.sSelectedRowClass);
                    });
                    $(event.target.parentNode).addClass(properties.sSelectedRowClass);
                    if (oDeleteRowButton != null) {
                        fnEnableDeleteButton();
                    }
                }
            });
            } else {
                oTable.keys.event.focus(null, null, function (nNode, x, y) {

                });
            }

            if (properties.aoTableActions != null) {
                for (i = 0; i < properties.aoTableActions.length; i++) {
                    var oTableAction = $.extend({ sType: "edit" }, properties.aoTableActions[i]);
                    var sAction = oTableAction.sAction;
                    var sActionFormId = oTableAction.sActionFormId;

                    var oActionForm = $("#form" + sAction);
                    if (oActionForm.length !== 0) {
                        var oFormOptions = { autoOpen: false, modal: true };
                        oFormOptions = $.extend({}, oTableAction.oFormOptions, oFormOptions);
                        oActionForm.dialog(oFormOptions);
                        oActionForm.data("action-options", oTableAction);

                        var oActionFormLink = $(".table-action-" + sAction);
                        if (oActionFormLink.length !== 0) {

                            oActionFormLink.on("click", function () {


                                var sClass = this.className;
                                var classList = sClass.split(/\s+/);
                                var sActionFormId = "";
                                var sAction = "";
                                for (i = 0; i < classList.length; i++) {
                                    if (classList[i].indexOf("table-action-") > -1) {
                                        sAction = classList[i].replace("table-action-", "");
                                        sActionFormId = "#form" + sAction;
                                    }
                                }
                                if (sActionFormId === "") {
                                    properties.fnShowError("Cannot find a form with an id " + sActionFormId + " that should be associated to the action - " + sAction, sAction);
                                }

                                var oTableAction = $(sActionFormId).data("action-options");

                                if (oTableAction.sType === "edit") {

                                    //var oTD = ($(this).parents('td'))[0];
                                    var oTR = ($(this).parents("tr"))[0];
                                    fnPopulateFormWithRowCells(oActionForm, oTR);
                                }
                                $(oActionForm).dialog("open");
                            });
                        }

                        oActionForm.submit(function (event) {

                            fnSendFormUpdateRequest(this);
                            return false;
                        });


                        var aActionFormButtons = new Array();

                        //var oActionSubmitButton = $("#form" + sAction + "Ok", oActionForm);
                        //aActionFormButtons.push(oActionSubmitButton);
                        var oActionFormCancel = $("#form" + sAction + "Cancel", oActionForm);
                        if (oActionFormCancel.length !== 0) {
                            aActionFormButtons.push(oActionFormCancel);
                            oActionFormCancel.click(function () {

                                var oActionForm = $(this).parents("form")[0];
                                //Clear the validation messages and reset form
                                $(oActionForm).validate().resetForm();  // Clears the validation errors
                                $(oActionForm)[0].reset();

                                $(".error", $(oActionForm)).html("");
                                $(".error", $(oActionForm)).hide();  // Hides the error element
                                $(oActionForm).dialog("close");
                            });
                        }

                        //Convert all action form buttons to the JQuery UI buttons
                        $("button", oActionForm).button();
                        /*
                        if (aActionFormButtons.length > 0) {
                        oActionForm.dialog('option', 'buttons', aActionFormButtons);
                        }
                        */



                    }




                } // end for (var i = 0; i < properties.aoTableActions.length; i++)
            } //end if (properties.aoTableActions != null)


        });
    };
})(jQuery);
/////////////////
/*
 * Jeditable - jQuery in place edit plugin
 *
 * Copyright (c) 2006-2013 Mika Tuupola, Dylan Verheul
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *   http://www.appelsiini.net/projects/jeditable
 *
 * Based on editable by Dylan Verheul <dylan_at_dyve.net>:
 *    http://www.dyve.net/jquery/?editable
 *
 */

/**
  * Version 1.7.3
  *
  * ** means there is basic unit tests for this parameter. 
  *
  * @name  Jeditable
  * @type  jQuery
  * @param String  target             (POST) URL or function to send edited content to **
  * @param Hash    options            additional options 
  * @param String  options[method]    method to use to send edited content (POST or PUT) **
  * @param Function options[callback] Function to run after submitting edited content **
  * @param String  options[name]      POST parameter name of edited content
  * @param String  options[id]        POST parameter name of edited div id
  * @param Hash    options[submitdata] Extra parameters to send when submitting edited content.
  * @param String  options[type]      text, textarea or select (or any 3rd party input type) **
  * @param Integer options[rows]      number of rows if using textarea ** 
  * @param Integer options[cols]      number of columns if using textarea **
  * @param Mixed   options[height]    'auto', 'none' or height in pixels **
  * @param Mixed   options[width]     'auto', 'none' or width in pixels **
  * @param String  options[loadurl]   URL to fetch input content before editing **
  * @param String  options[loadtype]  Request type for load url. Should be GET or POST.
  * @param String  options[loadtext]  Text to display while loading external content.
  * @param Mixed   options[loaddata]  Extra parameters to pass when fetching content before editing.
  * @param Mixed   options[data]      Or content given as paramameter. String or function.**
  * @param String  options[indicator] indicator html to show when saving
  * @param String  options[tooltip]   optional tooltip text via title attribute **
  * @param String  options[event]     jQuery event such as 'click' of 'dblclick' **
  * @param String  options[submit]    submit button value, empty means no button **
  * @param String  options[cancel]    cancel button value, empty means no button **
  * @param String  options[cssclass]  CSS class to apply to input form. 'inherit' to copy from parent. **
  * @param String  options[style]     Style to apply to input form 'inherit' to copy from parent. **
  * @param String  options[select]    true or false, when true text is highlighted ??
  * @param String  options[placeholder] Placeholder text or html to insert when element is empty. **
  * @param String  options[onblur]    'cancel', 'submit', 'ignore' or function ??
  * @param String  options[inputcss]    CSS class to apply to input itself ??
  *             
  * @param Function options[onsubmit] function(settings, original) { ... } called before submit
  * @param Function options[onreset]  function(settings, original) { ... } called before reset
  * @param Function options[onerror]  function(settings, original, xhr) { ... } called on error
  *             
  * @param Hash    options[ajaxoptions]  jQuery Ajax options. See docs.jquery.com.
  *             
  */

(function($) {

    $.fn.editable = function(target, options) {
            
        if ('disable' == target) {
            $(this).data('disabled.editable', true);
            return;
        }
        if ('enable' == target) {
            $(this).data('disabled.editable', false);
            return;
        }
        if ('destroy' == target) {
            $(this)
                .unbind($(this).data('event.editable'))
                .removeData('disabled.editable')
                .removeData('event.editable');
            return;
        }
        
        var settings = $.extend({}, $.fn.editable.defaults, {target:target}, options);
        
        /* setup some functions */
        var plugin   = $.editable.types[settings.type].plugin || function() { };
        var submit   = $.editable.types[settings.type].submit || function() { };
        var buttons  = $.editable.types[settings.type].buttons 
                    || $.editable.types['defaults'].buttons;
        var content  = $.editable.types[settings.type].content 
                    || $.editable.types['defaults'].content;
        var element  = $.editable.types[settings.type].element 
                    || $.editable.types['defaults'].element;
        var reset    = $.editable.types[settings.type].reset 
                    || $.editable.types['defaults'].reset;
        var callback = settings.callback || function() { };
        var onedit   = settings.onedit   || function() { }; 
        var onsubmit = settings.onsubmit || function() { };
        var onreset  = settings.onreset  || function() { };
        var onerror  = settings.onerror  || reset;
          
        /* Show tooltip. */
        if (settings.tooltip) {
            $(this).attr('title', settings.tooltip);
        }
        
        settings.autowidth  = 'auto' == settings.width;
        settings.autoheight = 'auto' == settings.height;
        
        return this.each(function() {
                        
            /* Save this to self because this changes when scope changes. */
            var self = this;  
                   
            /* Inlined block elements lose their width and height after first edit. */
            /* Save them for later use as workaround. */
            var savedwidth  = $(self).width();
            var savedheight = $(self).height();

            /* Save so it can be later used by $.editable('destroy') */
            $(this).data('event.editable', settings.event);
            
            /* If element is empty add something clickable (if requested) */
            if (!$.trim($(this).html())) {
                $(this).html(settings.placeholder);
            }
            
            $(this).bind(settings.event, function(e) {
                
                /* Abort if element is disabled. */
                if (true === $(this).data('disabled.editable')) {
                    return;
                }
                
                /* Prevent throwing an exeption if edit field is clicked again. */
                if (self.editing) {
                    return;
                }
                
                /* Abort if onedit hook returns false. */
                if (false === onedit.apply(this, [settings, self])) {
                   return;
                }
                
                /* Prevent default action and bubbling. */
                e.preventDefault();
                e.stopPropagation();
                
                /* Remove tooltip. */
                if (settings.tooltip) {
                    $(self).removeAttr('title');
                }
                
                /* Figure out how wide and tall we are, saved width and height. */
                /* Workaround for http://dev.jquery.com/ticket/2190 */
                if (0 == $(self).width()) {
                    settings.width  = savedwidth;
                    settings.height = savedheight;
                } else {
                    if (settings.width != 'none') {
                        settings.width = 
                            settings.autowidth ? $(self).width()  : settings.width;
                    }
                    if (settings.height != 'none') {
                        settings.height = 
                            settings.autoheight ? $(self).height() : settings.height;
                    }
                }
                
                /* Remove placeholder text, replace is here because of IE. */
                if ($(this).html().toLowerCase().replace(/(;|"|\/)/g, '') == 
                    settings.placeholder.toLowerCase().replace(/(;|"|\/)/g, '')) {
                        $(this).html('');
                }
//                     if ($(this).html().toLowerCase().replace(/"/g,"&quot;"); == 
//                     settings.placeholder.toLowerCase().replace(/"/g,"&quot;");) {
//                         $(this).html('');
//                 }
                     
                     
                self.editing    = true;
                self.revert     = $(self).html();
                $(self).html('');

                /* Create the form object. */
                var form = $('<form />');
                
                /* Apply css or style or both. */
                if (settings.cssclass) {
                    if ('inherit' == settings.cssclass) {
                        form.attr('class', $(self).attr('class'));
                    } else {
                        form.attr('class', settings.cssclass);
                    }
                }

                if (settings.style) {
                    if ('inherit' == settings.style) {
                        form.attr('style', $(self).attr('style'));
                        /* IE needs the second line or display wont be inherited. */
                        form.css('display', $(self).css('display'));                
                    } else {
                        form.attr('style', settings.style);
                    }
                }

                /* Add main input element to form and store it in input. */
                var input = element.apply(form, [settings, self]);
 
                /* Apply css class to input: https://github.com/tuupola/jquery_jeditable/pull/132/files */
                if (settings.inputclass) {
                    if ('inherit' == settings.inputclass) {
                        input.attr('class', $(self).attr('class'));            
                    } else {
                        input.attr('class', settings.inputclass);
                    }
                }

                /* Set input content via POST, GET, given data or existing value. */
                var input_content;
                
                if (settings.loadurl) {
                    var t = setTimeout(function() {
                        input.disabled = true;
                        content.apply(form, [settings.loadtext, settings, self]);
                    }, 100);

                    var loaddata = {};
                    loaddata[settings.id] = self.id;
                    if ($.isFunction(settings.loaddata)) {
                        $.extend(loaddata, settings.loaddata.apply(self, [self.revert, settings]));
                    } else {
                        $.extend(loaddata, settings.loaddata);
                    }
                    $.ajax({
                       type : settings.loadtype,
                       url  : settings.loadurl,
                       data : loaddata,
                       async : false,
                       success: function(result) {
                          window.clearTimeout(t);
                          input_content = result;
                          input.disabled = false;
                       }
                    });
                } else if (settings.data) {
                    input_content = settings.data;
                    if ($.isFunction(settings.data)) {
                        input_content = settings.data.apply(self, [self.revert, settings]);
                    }
                } else {
                    input_content = self.revert; 
                }
                content.apply(form, [input_content, settings, self]);

                input.attr('name', settings.name);
        
                /* Add buttons to the form. */
                buttons.apply(form, [settings, self]);
         
                /* Add created form to self. */
                $(self).append(form);
         
                /* Attach 3rd party plugin if requested. */
                plugin.apply(form, [settings, self]);

                /* Focus to first visible form element. */
                $(':input:visible:enabled:first', form).focus();

                /* Highlight input contents when requested. */
                if (settings.select) {
                    input.select();
                }
        
                /* discard changes if pressing esc */
                input.keydown(function(e) {
                    if (e.keyCode == 27) {
                        e.preventDefault();
                        reset.apply(form, [settings, self]);
                    }
                });

                /* Discard, submit or nothing with changes when clicking outside. */
                /* Do nothing is usable when navigating with tab. */
                var t;
                if ('cancel' == settings.onblur) {
                    input.blur(function(e) {
                        /* Prevent canceling if submit was clicked. */
                        t = setTimeout(function() {
                            reset.apply(form, [settings, self]);
                        }, 500);
                    });
                } else if ('submit' == settings.onblur) {
                    input.blur(function(e) {
                        /* Prevent double submit if submit was clicked. */
                        t = setTimeout(function() {
                            form.submit();
                        }, 200);
                    });
                } else if ($.isFunction(settings.onblur)) {
                    input.blur(function(e) {
                        settings.onblur.apply(self, [input.val(), settings]);
                    });
                } else {
                    input.blur(function(e) {
                      /* TODO: maybe something here */
                    });
                }

                form.submit(function(e) {

                    if (t) { 
                        clearTimeout(t);
                    }

                    /* Do no submit. */
                    e.preventDefault(); 
            
                    /* Call before submit hook. */
                    /* If it returns false abort submitting. */                    
                    if (false !== onsubmit.apply(form, [settings, self])) { 
                        /* Custom inputs call before submit hook. */
                        /* If it returns false abort submitting. */
                        if (false !== submit.apply(form, [settings, self])) { 

                          /* Check if given target is function */
                          if ($.isFunction(settings.target)) {
                              var str = settings.target.apply(self, [input.val(), settings]);
                              $(self).html(str);
                              self.editing = false;
                              callback.apply(self, [self.innerHTML, settings]);
                              /* TODO: this is not dry */                              
                              if (!$.trim($(self).html())) {
                                  $(self).html(settings.placeholder);
                              }
                          } else {
                              /* Add edited content and id of edited element to POST. */
                              var submitdata = {};
                              submitdata[settings.name] = input.val();
                              submitdata[settings.id] = self.id;
                              /* Add extra data to be POST:ed. */
                              if ($.isFunction(settings.submitdata)) {
                                  $.extend(submitdata, settings.submitdata.apply(self, [self.revert, settings]));
                              } else {
                                  $.extend(submitdata, settings.submitdata);
                              }

                              /* Quick and dirty PUT support. */
                              if ('PUT' == settings.method) {
                                  submitdata['_method'] = 'put';
                              }

                              /* Show the saving indicator. */
                              $(self).html(settings.indicator);
                              
                              /* Defaults for ajaxoptions. */
                              var ajaxoptions = {
                                  type    : 'POST',
                                  data    : submitdata,
                                  dataType: 'html',
                                  url     : settings.target,
                                  success : function(result, status) {
                                      if (ajaxoptions.dataType == 'html') {
                                        $(self).html(result);
                                      }
                                      self.editing = false;
                                      callback.apply(self, [result, settings]);
                                      if (!$.trim($(self).html())) {
                                          $(self).html(settings.placeholder);
                                      }
                                  },
                                  error   : function(xhr, status, error) {
                                      onerror.apply(form, [settings, self, xhr]);
                                  }
                              };
                              
                              /* Override with what is given in settings.ajaxoptions. */
                              $.extend(ajaxoptions, settings.ajaxoptions);   
                              $.ajax(ajaxoptions);          
                              
                            }
                        }
                    }
                    
                    /* Show tooltip again. */
                    $(self).attr('title', settings.tooltip);
                    
                    return false;
                });
            });
            
            /* Privileged methods */
            this.reset = function(form) {
                /* Prevent calling reset twice when blurring. */
                if (this.editing) {
                    /* Before reset hook, if it returns false abort reseting. */
                    if (false !== onreset.apply(form, [settings, self])) { 
                        $(self).html(self.revert);
                        self.editing   = false;
                        if (!$.trim($(self).html())) {
                            $(self).html(settings.placeholder);
                        }
                        /* Show tooltip again. */
                        if (settings.tooltip) {
                            $(self).attr('title', settings.tooltip);                
                        }
                    }                    
                }
            };            
        });

    };


    $.editable = {
        types: {
            defaults: {
                element : function(settings, original) {
                    var input = $('<input type="hidden"></input>');                
                    $(this).append(input);
                    return(input);
                },
                content : function(string, settings, original) {
                    $(':input:first', this).val(string);
                },
                reset : function(settings, original) {
                  original.reset(this);
                },
                buttons : function(settings, original) {
                    var form = this;
                    if (settings.submit) {
                        /* If given html string use that. */
                        if (settings.submit.match(/>$/)) {
                            var submit = $(settings.submit).click(function() {
                                if (submit.attr("type") != "submit") {
                                    form.submit();
                                }
                            });
                        /* Otherwise use button with given string as text. */
                        } else {
                            var submit = $('<button type="submit" />');
                            submit.html(settings.submit);                            
                        }
                        $(this).append(submit);
                    }
                    if (settings.cancel) {
                        /* If given html string use that. */
                        if (settings.cancel.match(/>$/)) {
                            var cancel = $(settings.cancel);
                        /* otherwise use button with given string as text */
                        } else {
                            var cancel = $('<button type="cancel" />');
                            cancel.html(settings.cancel);
                        }
                        $(this).append(cancel);

                        $(cancel).click(function(event) {
                            if ($.isFunction($.editable.types[settings.type].reset)) {
                                var reset = $.editable.types[settings.type].reset;                                                                
                            } else {
                                var reset = $.editable.types['defaults'].reset;                                
                            }
                            reset.apply(form, [settings, original]);
                            return false;
                        });
                    }
                }
            },
            file: {
                element : function(settings, original) {
                    var input = $('<form enctype="multipart/form-data" action="__URL__" method="POST"><input type="hidden" name="MAX_FILE_SIZE" value="30000" /><input name="userfile" type="file" /><input type="submit" value="Send File" /></form>');

                    $(this).append(input);
                    return(input);
                }
            },
            text: {
                element : function(settings, original) {
                    var input = $('<input />');
                    if (settings.width  != 'none') { input.width(settings.width);  }
                    if (settings.height != 'none') { input.height(settings.height); }
                    /* https://bugzilla.mozilla.org/show_bug.cgi?id=236791 */
                    //input[0].setAttribute('autocomplete','off');
                    input.attr('autocomplete','off');
                    $(this).append(input);
                    return(input);
                }
            },
            textarea: {
                element : function(settings, original) {
                    var textarea = $('<textarea />');
                    if (settings.rows) {
                        textarea.attr('rows', settings.rows);
                    } else if (settings.height != "none") {
                        textarea.height(settings.height);
                    }
                    if (settings.cols) {
                        textarea.attr('cols', settings.cols);
                    } else if (settings.width != "none") {
                        textarea.width(settings.width);
                    }
                    $(this).append(textarea);
                    return(textarea);
                }
            },
            select: {
               element : function(settings, original) {
                    var select = $('<select />');
                    $(this).append(select);
                    return(select);
                },
                content : function(data, settings, original) {
                    /* If it is string assume it is json. */
                    if (String == data.constructor) {      
                        eval ('var json = ' + data);
                    } else {
                    /* Otherwise assume it is a hash already. */
                        var json = data;
                    }
                    for (var key in json) {
                        if (!json.hasOwnProperty(key)) {
                            continue;
                        }
                        if ('selected' == key) {
                            continue;
                        } 
                        var option = $('<option />').val(key).append(json[key]);
                        $('select', this).append(option);    
                    }                    
                    /* Loop option again to set selected. IE needed this... */ 
                    $('select', this).children().each(function() {
                        if ($(this).val() == json['selected'] || 
                            $(this).text() == $.trim(original.revert)) {
                                $(this).attr('selected', 'selected');
                        }
                    });
                    /* Submit on change if no submit button defined. */
                    if (!settings.submit) {
                        var form = this;
                        $('select', this).change(function() {
                            form.submit();
                        });
                    }
                }
            }
        },

        /* Add new input type */
        addInputType: function(name, input) {
            $.editable.types[name] = input;
        }
    };

    /* Publicly accessible defaults. */
    $.fn.editable.defaults = {
        name       : 'value',
        id         : 'id',
        type       : 'text',
        width      : 'auto',
        height     : 'auto',
        event      : 'click.editable',
        onblur     : 'cancel',
        loadtype   : 'GET',
        loadtext   : 'Loading...',
        placeholder: 'Duble click to edit',
        loaddata   : {},
        submitdata : {},
        ajaxoptions: {},
        inputclass : 'form-control'
    };

})(jQuery);


/////////////////
