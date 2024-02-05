export type Data = Datum[];

export interface Datum {
  date: Date;
  temperature: number;
  place: "In" | "Out";
}
