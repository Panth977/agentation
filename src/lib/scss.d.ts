// Type declarations for SCSS / SCSS-module imports.
declare module "*.module.scss" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.scss" {
  const content: { [key: string]: string };
  export default content;
}
