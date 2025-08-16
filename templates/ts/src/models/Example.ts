export interface Example { id: number; name: string; }
export class ExampleModel {
  private static data: Example[] = [{ id: 1, name: 'Sample' }];
  static all(): Example[] { return this.data; }
}
