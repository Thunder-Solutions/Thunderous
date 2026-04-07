const MyElement = customElement((params) => {
  const {
    internals,
    elementRef,
    root,
    connectedCallback,
  } = params;

  internals.role = 'button';

  connectedCallback(() => {
    console.log(elementRef.querySelector('a[href]')); // light DOM
    console.log(root.querySelector('a[href]')); // shadow DOM
  });

  // ...
});