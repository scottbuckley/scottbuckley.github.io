// some newtypes to differentiate different kinds of coords/measurements
// canvas coordinates (relative to canvas resolution pixels)
type canvCoord = number & { readonly __tag: unique symbol };

type canvMeasure = number & { readonly __tag: unique symbol };

// cell / grid coordinates
type cellCoord = number & { readonly __tag: unique symbol };

// a small integer - a number of cells (grid width or height etc)
type cellCount = number & { readonly __tag: unique symbol };

// number intended to be between 0 and 1, usually representing a percentage
type portion = number & { readonly __tag: unique symbol };