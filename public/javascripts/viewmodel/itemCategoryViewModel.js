import { getTranslation, translate, infoPanel, tableExport, getEditing, notify, isMaster, get } from './globalData.js';

$(async () => {
    window.jsPDF = window.jspdf.jsPDF;

    let language = await getTranslation('itemCategory');
    let languageItem = await getTranslation('item');
    let languageItemCategoryList = await getTranslation('itemCategoryList');

    translation();
    initialize();
    await load();
    infoPanel();

    //#region Initialize
    function initialize() {

    }
    //#endregion

    //#region Load
    async function load() {
        $("#dataGrid").dxDataGrid({
            dataSource: new DevExpress.data.CustomStore({
                key: "handle",
                loadMode: "raw",
                load: async function (loadOptions) {
                    return await get(`/itemCategory`, language);
                }
            }),
            filterRow: { visible: false },
            filterPanel: { visible: false },
            searchPanel: { visible: false },
            allowColumnReordering: true,
            allowColumnResizing: true,
            groupPanel: { visible: true },
            selection: { mode: "single" },
            paging: {
                pageSize: 10
            },
            pager: {
                visible: true,
                allowedPageSizes: [10, 25, 50, 100, 'all'],
                showPageSizeSelector: true,
                showInfo: true,
                showNavigationButtons: true,
            },
            columnChooser: {
                enabled: true,
                allowSearch: true,
            },
            showRowLines: true,
            showBorders: true,
            masterDetail: {
                enabled: true,
                template(container, options) {
                    container.append($("<div>").dxDataGrid({
                        dataSource: options.data.items,
                        allowColumnReordering: true,
                        allowColumnResizing: true,
                        columns: [
                            { dataField: "value", caption: translate(languageItem, 'value'), validationRules: [{ type: "required" }]  },
                            { dataField: "gold", caption: translate(languageItem, 'gold'), validationRules: [{ type: "required" }], width: 200 }
                        ]
                    }));
                }
            },
            columns: [
                {
                    caption: translate(language, 'value'),
                    calculateCellValue(data) {
                      return translate(languageItemCategoryList, data.value)
                    }
                },
                {
                    caption: translate(language, 'count'), width: 250,
                    calculateCellValue(data) {
                        if(data.items != null) {
                            return data.items.length;
                        } else {
                            return 0;
                        }
                    }
                },
                {
                    type: "buttons",
                    visible: await isMaster(),
                    buttons: [{
                        icon: "check",
                        hint: translate(language, "checkHint"),
                        onClick: function (e) {
                            fetch(`./api/itemCategory/default/transfer/${e.row.key}`, {
                                method: 'post',
                                headers: {
                                    'Content-type': 'application/json'
                                }
                            }).then(async function (res) {
                                switch(res.status){
                                    case 201:
                                        notify(translate(language, res.status), "success");
                                        infoPanel();
                                        break;
                                    default:
                                        notify(translate(language, res.status), "error");
                                        break;
                                }
                            });
                        }
                    }]
                }
            ],
            //editing: await getEditing(),
            export: {
                enabled: true,
                formats: ['xlsx', 'pdf']
            },
            onExporting(e) {
                tableExport(e, translate(language, 'title'))
            }
        });
    }
    //#endregion

    //#region Translation
    function translation() {
        document.getElementById("labelTitle").textContent = translate(language, 'title');
    }
    //#endregion
});