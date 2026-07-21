export function renderDiagnostics(diagnostic) {

    if (!diagnostic) {
        return `
            <section class="card">
                <h2>Diagnostics</h2>
                <p>Aucun diagnostic disponible.</p>
            </section>
        `;
    }

    return `
        <section class="card">

            <h2>Diagnostics</h2>

            <p>
                Dernier contrôle :
                <strong>${diagnostic.checkedAt ?? "-"}</strong>
            </p>

            <p>
                Paris vérifiés :
                <strong>${diagnostic.betsBefore?.length ?? 0}</strong>
            </p>

            <p>
                Rapports :
                <strong>${diagnostic.reports?.length ?? 0}</strong>
            </p>

            <p>
                Erreur :
                <strong>${diagnostic.globalError ?? "Aucune"}</strong>
            </p>

        </section>
    `;
}