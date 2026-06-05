export function renderQuinielaAuth() {
  return `
    <div class="q-auth">
      <div class="q-auth-tabs">
        <button class="q-auth-tab q-auth-tab--active" data-panel="q-login-panel">Iniciar Sesión</button>
        <button class="q-auth-tab" data-panel="q-register-panel">Registrarse</button>
      </div>

      <div id="q-login-panel" class="q-auth-panel q-auth-panel--active">
        <form id="q-login-form" class="q-auth-form">
          <div class="q-form-group">
            <label for="q-login-email">Email</label>
            <input type="email" id="q-login-email" required placeholder="tu@email.com">
          </div>
          <div class="q-form-group">
            <label for="q-login-pin">PIN (6 dígitos)</label>
            <input type="text" id="q-login-pin" required maxlength="6" pattern="[0-9]{6}" placeholder="123456">
          </div>
          <button type="submit" class="q-btn q-btn--primary q-btn--full">Iniciar Sesión</button>
          <p class="q-form-forgot"><a href="#" id="q-forgot-pin">¿Olvidaste tu PIN?</a></p>
          <p class="q-form-msg"></p>
        </form>
      </div>

      <div id="q-register-panel" class="q-auth-panel">
        <form id="q-register-form" class="q-auth-form">
          <div class="q-form-group">
            <label for="q-reg-name">Nombre</label>
            <input type="text" id="q-reg-name" required placeholder="Tu nombre" maxlength="100">
          </div>
          <div class="q-form-group">
            <label for="q-reg-email">Email</label>
            <input type="email" id="q-reg-email" required placeholder="tu@email.com">
          </div>
          <button type="submit" class="q-btn q-btn--primary q-btn--full">Registrarse</button>
          <p class="q-form-msg"></p>
        </form>
      </div>
    </div>
  `;
}
