//#region Translation
export async function getTranslation(page, language = 'de-DE') {
    return await get(`/translation/${page.replace('/', '').replace('\\', '')}?language=${language}`);
}

export function translate(language, handle) {
    if (language && handle) {
        var value = language.find(x => x.handle == handle)

        if (value && value.translation)
            return value.translation;
    }
    return '[missing translation]'; 
}
//#endregion

//#region InfoPanel  
export async function infoPanel() {
    let languageInfo = await getTranslation('information');
    let userData = await loadUserData();
    let defaultNode = await loadDefaultNode();
    
    $("#info-panel").dxButtonGroup({
        width:"100%",
        items: [{ 
            text: (userData != null) ? translate(languageInfo, 'login').replace('$1', userData.display_name) : translate(languageInfo, 'noLogin'),
            disabled: true, 
            stylingMode: "text" 
        }, {
            text: (defaultNode != null) ? translate(languageInfo, 'streamer').replace('$1', defaultNode.displayName) : translate(languageInfo, 'noStreamer'),
            disabled: true, 
            stylingMode: "text"
        }],
    });
}
//#endregion

//#region Load
export async function loadUserData() {
    return await get(`/twitch/userdata`);
}

export async function loadDefaultNode() {
    return await get(`/node/default`);
}
//#endregion

//#region Export
export function tableExport(e, name) {
    if (e.format === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Main sheet");
        DevExpress.excelExporter.exportDataGrid({
            worksheet: worksheet,
            component: e.component,
        }).then(function () {
            workbook.xlsx.writeBuffer().then(function (buffer) {
                saveAs(new Blob([buffer], { type: "application/octet-stream" }), name + ".xlsx");
            });
        });
        e.cancel = true;
    }
    else if (e.format === 'pdf') {
        const doc = new jsPDF();
        DevExpress.pdfExporter.exportDataGrid({
            jsPDFDocument: doc,
            component: e.component,
        }).then(() => {
            doc.save(name + '.pdf');
        });
    }
}
//#endregion

//#region Notify
export function notify(message, type) {
    //type: error, info, success, warning;
    DevExpress.ui.notify(
        {
            message: message,
            width: 300,
            position: {
                my: "bottom",
                at: "center",
                of: "#sticky-footer"
            }
        },
        type,
        2000
    );
}
//#endregion

//#region Editing
export async function getEditing(allowUpdating = true, allowAdding = true, allowDeleting = true) {
    let userData = await loadUserData();
    let defaultNode = await loadDefaultNode();

    /*
    return {
        mode: "popup",
        allowUpdating: true,
        allowDeleting: true,
        allowAdding: true
    }
    */

    if(userData != null && defaultNode?.name != null){
        return {
            mode: "popup",
            allowUpdating: userData.login === defaultNode.name && allowUpdating,
            allowDeleting: userData.login === defaultNode.name && allowDeleting,
            allowAdding: userData.login === defaultNode.name && allowAdding,
        }
    } else {
        return {
            mode: "popup",
            allowUpdating: false,
            allowDeleting: false,
            allowAdding: false
        }
    }

}
//#endregion

//#region Editing
export async function isMaster() {
    let userData = await loadUserData();
    let defaultNode = await loadDefaultNode();

    if(userData != null && defaultNode?.name != null){
        return userData.login === defaultNode.name;
    }
    return false; //true

}
//#endregion

//#region Get
export async function get(endpoint, language = undefined) {
    let items;

    if (endpoint) {
        await fetch('./api' + endpoint, {
            method: 'get',
            headers: {
                'Content-type': 'application/json'
            }
        }).then(async function (res) {
            //console.log(res);
            switch (res.status) {
                case 200:
                case 201:
                    items = await res.json();
                    break;
                default:
                    if (language != undefined)
                        notify(translate(language, res.status), 'error');
                    break;
            }
            return items;
        });
    }

    return items;
}
//#endregion

//#region Clipboard
export function copyToClipboard(text) {
    console.log(text);
    navigator.clipboard.writeText(text);
}
//#endregion