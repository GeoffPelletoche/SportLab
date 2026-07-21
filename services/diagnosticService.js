export function getSettlementDiagnostic() {

    try {

        const json =
            localStorage.getItem(
                "sportlab_settlement_debug"
            );

        if (!json) {
            return null;
        }

        return JSON.parse(json);

    } catch {

        return null;

    }

}