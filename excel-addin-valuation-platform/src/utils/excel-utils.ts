/* global Excel */

export const writeValuationToExcel = async (data: any) => {
    await Excel.run(async (context) => {
        // 1. Overview Sheet
        let sheet = context.workbook.worksheets.getItemOrNullObject("Valuation Overview");
        await context.sync();

        if (sheet.isNullObject) {
            inputRange.values = inputRows;
            context.workbook.names.add("Val_Inputs", inputRange);
        }

        // 3. Outputs Sheet (Read Only)
        let outputSheet = context.workbook.worksheets.getItemOrNullObject("Valuation Outputs");
        await context.sync();
        if (outputSheet.isNullObject) {
            outputSheet = context.workbook.worksheets.add("Valuation Outputs");
        }

        const outputs = data.outputs;
        const outputRows = Object.entries(outputs).map(([k, v]) => [k, v]);

        if (outputRows.length > 0) {
            const outputRange = outputSheet.getRange(`A1:B${outputRows.length}`);
            outputRange.values = outputRows;
            outputRange.format.fill.color = "#f0f0f0"; // Grey out to indicate read-only
        }

        etag: etagRange.values[0][0], // This is actually the last_updated timestamp we stored
            inputs: inputs
    };
});
};
