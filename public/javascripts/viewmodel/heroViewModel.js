import { getTranslation, translate, infoPanel, get, loadUserData, notify } from './globalData.js';

$(async () => {
    window.jsPDF = window.jspdf.jsPDF;

    let language = await getTranslation('hero');
    let languageItem = await getTranslation('item');
    let languageWallet = await getTranslation('wallet');
    let languageTrait = await getTranslation('trait');
    let languageAdventure = await getTranslation('adventure');
    let languageLevel = await getTranslation('level');
    let languageInventory = await getTranslation('inventory');
    let languageItemCategoryList = await getTranslation('itemCategoryList');
    let languageItemCategory = await getTranslation('itemCategory');

    let category = await get('/itemcategory/default/', language);
    let userdata = {};
    let hero = {};
    let level = {};

    await initialize();
    translation();
    load();
    infoPanel();
    
    //#region Initialize
    async function initialize() {
        userdata = await loadUserData();
        hero = await get('/hero/default/' + userdata.login, language)
        level = await get('/level/default/' + hero.experience, language)
    }
    //#endregion

    //#region Load
    function load() {
        $("#dataGrid").dxDataGrid({
            dataSource: new DevExpress.data.CustomStore({
                key: "name",
                loadMode: "raw",
                load: async function (loadOptions) {
                    return [hero];
                }
            }),
            filterRow: { visible: true },
            filterPanel: { visible: true },
            searchPanel: { visible: true },
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
                autoExpandAll:true,
                template: masterDetailTemplate
            },
            columns: [                
                {
                    dataField: 'Picture',
                    caption: "",
                    width: 100,
                    allowFiltering: false,
                    allowSorting: false,
                    cellTemplate(container, options) {
                    $('<div>')
                        .append($('<img>', { src: options.data.profileImageUrl != null ?options.data.profileImageUrl : '/images/prestige/' + options.row.data.prestige + '.png', width: 64, height: 64 }))
                        .appendTo(container);
                    },
                },
                { dataField: "name", caption: translate(language, 'name') },
                { caption: translate(languageLevel, 'handle'),
                    calculateCellValue(data) {
                        return level.handle;
                }}, 
                { dataField: "experience", caption: translate(language, 'experience'), width: 250, 
                    cellTemplate: function (container, options) {  
                        $("<div />").attr({ 'class': 'cls', 'data-key': options.data.name }).dxProgressBar({  
                            min: level.experienceMin,  
                            max: level.experienceMax,
                            value: options.data.experience,
                            statusFormat: function(){
                                return options.data.experience + ' / ' + level.experienceMax
                            }  
                        }).appendTo(container);  
                    }
                }, 
                { dataField: "hitpoints", caption: translate(language, 'hitpoints'), width: 200, 
                    cellTemplate: function (container, options) {  
                        $("<div />").attr({ 'class': 'cls', 'data-key': options.data.name }).dxProgressBar({  
                            min: 0,  
                            max: options.data.hitpointsMax,
                            value: options.data.hitpoints,
                            statusFormat: function(){
                                return options.data.hitpoints + '/' + options.data.hitpointsMax
                            }  
                        }).appendTo(container);  
                    }
                }, 
                { dataField: 'strength', caption: translate(language, 'strength'), width: 150 },
                { dataField: 'lastSteal', caption: translate(language, 'lastSteal'), dataType: 'datetime', width: 150 },
                { dataField: 'lastJoin', caption: translate(language, 'lastJoin'), dataType: 'datetime', width: 150 },
                { dataField: 'lastDaily', caption: translate(language, 'lastDaily'), dataType: 'date', width: 200 },
                { dataField: "isActive", caption: translate(language, 'isActive'), width: 200, editorType: "dxCheckBox" }
            ],
            export: {
                enabled: true,
                formats: ['xlsx', 'pdf']
            },
            onExporting(e) {
                tableExport(e, translate(language, 'title'))
            }
        });

        function masterDetailTemplate(_, masterDetailOptions) {
            return $('<div>').dxTabPanel({
                items: [{
                    title: translate(language, 'inventory'),
                    template: createItemTabTemplate(masterDetailOptions.data, 1),
                }, {
                    title: translate(language, 'wallet'),
                    template: createWalletTabTemplate(masterDetailOptions.data, 1),
                }, {
                    title: translate(language, 'trait'),
                    template: createTraitTabTemplate(masterDetailOptions.data, 1),
                }, {
                    title: translate(languageAdventure, 'adventure'),
                    template: createAdventureTabTemplate(masterDetailOptions.data, 1),
                }],
            });
        }

        function createAdventureTabTemplate(masterDetailData) {
            return function () {
                return $('<div>').dxDataGrid({
                    dataSource: new DevExpress.data.CustomStore({
                        key: ["itemHandle", "heroName"],
                        loadMode: "raw",
                        load: async function () {
                            return await get(`/adventure/default/hero/${masterDetailData.name}`, language);
                        }
                    }),
                    allowColumnReordering: true,
                    allowColumnResizing: true,
                    selection: { mode: "single" },
                    editing: {
                        mode: "row",
                        allowUpdating: false,
                        allowDeleting: false,
                        allowAdding: false
                    },
                    columns: [
                        { dataField: "item.value", caption: translate(languageItem, 'value') },
                        { dataField: "item.gold", caption: translate(languageItem, 'gold'), width: 200 }
                    ]
                });
            };
        }

        function createItemTabTemplate(masterDetailData) {
            return function () {
                return $('<div>').dxDataGrid({
                    dataSource: new DevExpress.data.CustomStore({
                        key: ["itemHandle", "heroName"],
                        loadMode: "raw",
                        load: async function () {
                            return await get(`/heroinventory/default/hero/${masterDetailData.name}`, language);
                        },
                        remove: async function (key) {
                            await fetch(`./api/heroinventory/default/sell/item/${key.itemHandle}/hero/${key.heroName}`, {
                                method: 'post',
                                headers: {
                                    'Content-type': 'application/json'
                                }
                            }).then(async function (res) {
                                switch(res.status){
                                    case 200:
                                        notify(translate(languageInventory, res.status), "success");
                                        break;
                                    default:
                                        notify(translate(languageInventory, res.status), "error");
                                        break;
                                }
                            });
                        }
                    }),
                    allowColumnReordering: true,
                    allowColumnResizing: true,
                    selection: { mode: "single" },
                    editing: {
                        mode: "row",
                        allowUpdating: false,
                        allowDeleting: true,
                        allowAdding: false
                    },
                    columns: [
                        { dataField: "item.value", caption: translate(languageItem, 'value') },
                        {
                            dataField: 'item.categoryHandle',
                            caption: translate(languageItemCategory , 'value'), width: 300,
                            lookup: {
                              dataSource(options) {
                                return {
                                  store: {  
                                      type: 'array',  
                                      data: category,  
                                      key: "handle"  
                                    }
                                };
                              },
                              valueExpr: 'handle',
                              displayExpr: function(item) {
                                  return item && translate(languageItemCategoryList, item.value);
                              }
                            },
                        },
                        { dataField: "item.gold", caption: translate(languageItem, 'gold'), width: 200 },
                        { dataField: "quantity", caption: translate(language, 'quantity'), width: 200 },
                        {
                            caption: translate(language, 'total'), width: 250,
                            calculateCellValue(data) {
                              return data.quantity * data.item.gold;
                            }
                        },
                        {
                            type: "buttons",
                            buttons: [{
                                name: "delete",
                                icon: "check",
                                hint: translate(languageInventory, "checkSell"),
                            }]
                        }
                    ]
                });
            };
        }

        function createWalletTabTemplate(masterDetailData) {
            return function () {
                return $('<div>').dxDataGrid({
                    dataSource: new DevExpress.data.CustomStore({
                        key: ["heroName"],
                        loadMode: "raw",
                        load: async function () {
                            return [await get(`/herowallet/default/hero/${masterDetailData.name}`, language)];
                        }
                    }),
                    allowColumnReordering: true,
                    allowColumnResizing: true,
                    selection: { mode: "single" },
                    editing: {
                        mode: "row",
                        allowUpdating: false,
                        allowDeleting: false,
                        allowAdding: false
                    },
                    columns: [
                        { dataField: "gold", caption: translate(languageWallet, 'gold') },
                        { dataField: "diamond", caption: translate(languageWallet, 'diamond') },
                        { dataField: "blood", caption: translate(languageWallet, 'blood') },
                        { dataField: 'lastBlood', caption: translate(languageWallet, 'lastBlood'), dataType: 'datetime', width: 150 },
                    ]
                });
            };
        }

        function createTraitTabTemplate(masterDetailData) {
            return function () {
                return $('<div>').dxDataGrid({
                    dataSource: new DevExpress.data.CustomStore({
                        key: ["heroName"],
                        loadMode: "raw",
                        load: async function () {
                            return [await get(`/herotrait/default/hero/${masterDetailData.name}`, language)];
                        }
                    }),
                    allowColumnReordering: true,
                    allowColumnResizing: true,
                    selection: { mode: "single" },
                    editing: {
                        mode: "row",
                        allowUpdating: false,
                        allowDeleting: false,
                        allowAdding: false
                    },
                    columns: [
                        { dataField: "goldMultipler", caption: translate(languageTrait, 'goldMultipler') },
                        { dataField: "stealMultipler", caption: translate(languageTrait, 'stealMultipler') },
                        { dataField: "defenceMultipler", caption: translate(languageTrait, 'defenceMultipler') },
                        { dataField: "workMultipler", caption: translate(languageTrait, 'workMultipler') },
                        { dataField: "hitpointMultipler", caption: translate(languageTrait, 'hitpointMultipler') },
                        { dataField: "strengthMultipler", caption: translate(languageTrait, 'strengthMultipler') }
                    ]
                });
            };
        }
    }
    //#endregion

    //#region Translation
    function translation() {
        document.getElementById("labelTitle").textContent = userdata.display_name;
    }
    //#endregion
});
