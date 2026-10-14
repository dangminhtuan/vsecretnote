
// Mock minimal DOM
global.window = global; global.window.addEventListener = () => {};
global.document = {
  getElementById: (id) => {
    return {
      id,
      getContext: () => ({
        clearRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        save: () => {},
        restore: () => {},
        setLineDash: () => {},
        arc: () => {},
        fill: () => {}
      }),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 260 }),
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
      },
      style: {},
      appendChild: () => {},
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      innerHTML: '',
      textContent: ''
    };
  },
  createElement: (tag) => ({
    tagName: tag,
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {},
    appendChild: () => {},
    addEventListener: () => {},
    innerHTML: '',
    textContent: ''
  }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.setInterval = () => {};
global.setTimeout = () => {};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

import('./test_runtime.mjs')
  .then(() => console.log('RUNTIME EXECUTION SUCCESSFUL - NO CRASHES!'))
  .catch(err => {
    console.error('RUNTIME CRASH DETECTED:');
    console.error(err);
  });
