export class LinkPrecedence {
  public static readonly PRIMARY = new LinkPrecedence(1, 'primary');
  public static readonly SECONDARY = new LinkPrecedence(2, 'secondary');

  public static isPrimary(l: number) {
    return this.PRIMARY.getId() === l;
  }

  public static isSecondary(l: number) {
    return this.SECONDARY.getId() === l;
  }

  private id: number;
  private value: string;

  private constructor(id: number, value: string) {
    this.id = id;
    this.value = value;
  }

  public getId() {
    return this.id;
  }

  public getValue() {
    return this.value;
  }
}
