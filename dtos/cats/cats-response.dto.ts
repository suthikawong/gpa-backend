interface Cat {
  name: string;
  age: number;
  breed: string;
}

export interface GetCatResponse extends Cat {}

export interface CreateCatResponse extends Cat {}
