const MyElement = customElement(() => {
  return html`
    <div my-attr="${null}"></div> <!-- renders <div></div> -->
    <div my-attr="${''}"></div> <!-- renders <div my-attr></div> -->
  `;
});