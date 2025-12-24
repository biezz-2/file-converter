import * as jintr from 'jintr';
console.log('Jintr keys:', Object.keys(jintr));
if (jintr.Jinter) console.log('Jinter exists as named export');
if (jintr.default) {
    console.log('default export exists');
    console.log('default export keys:', Object.keys(jintr.default));
}
console.log('Full jintr object:', jintr);
