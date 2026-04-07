createEffect(({ lastValue, destroy }) => {
  const newCategory = category();

  // Suppose `handleCategoryChange()` sets up its own effect, leaving this one redundant.
  if (newCategory !== lastValue) {
    handleCategoryChange(newCategory);
    destroy(); // Unsubscribe the effect and exit early
    return;
  }

  // Handle each category differently
  if (newCategory === 'default') {
    handleDefaultCategory();
  } else {
    handleCustomCategory(newCategory);
  }

  // Return the new category to be used as the lastValue in the next effect run
  return newCategory;

// Pass the initial value to use as the lastValue in the first run
}, 'default');
