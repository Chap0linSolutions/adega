class Store {
  private static instance: Store;
  private data: any = {};
  constructor() {}
  static getInstance() {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }
  getData(key: string) {
    return this.data[key];
  }
  setData(key: string, value: any, force: boolean = false) {
    if (force || !this.data[key]) {
      this.data[key] = value;
      return;
    }
    throw 'property already set';
  }
}
