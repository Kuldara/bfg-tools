/* The page's state that more than one module assigns (an ES module cannot
   assign another module's variable). Each value is still set where it was
   declared - the appState.NAME = lines - this object only gives it one place to live. */
export const appState = {};
