export function renderFooter() {
  return `
    <footer style="margin-top: auto; padding: var(--spacing-2xl) 0; background-color: var(--bg-secondary); border-top: 1px solid var(--border-color);">
      <div class="container flex flex-col items-center gap-md">
        <div class="nav-brand" style="color: var(--text-muted);">MUNDIAL 2026</div>
        <p class="text-secondary" style="font-size: 0.85rem; text-align: center; max-width: 600px;">
          Este es un proyecto informativo no oficial. Inspirado en el diseño visual de FOX Sports, FIFA.com y ESPN para la Copa Mundial de la FIFA 2026™. Todos los logotipos y marcas comerciales pertenecen a sus respectivos dueños.
        </p>
      </div>
    </footer>
  `;
}
