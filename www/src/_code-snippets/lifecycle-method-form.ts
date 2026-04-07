const MyElement = customElement(({
  formAssociatedCallback,
  formDisabledCallback,
  formResetCallback,
  formStateRestoreCallback,
}) => {

  // ...

  return html`<input>`;
}, { formAssociated: true });