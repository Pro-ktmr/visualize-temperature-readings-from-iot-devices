"use client";

import { Visualizer } from "@/components/visualizer";
import { Data } from "@/lib/interfaces";
import * as csv from "csv/sync";
import * as dateFns from "date-fns";
import { Zen_Kaku_Gothic_New } from "next/font/google";
import { Dispatch, SetStateAction, useRef, useState } from "react";

const Font = Zen_Kaku_Gothic_New({ weight: "500", subsets: ["latin"] });

export default function Home() {
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [data, setData] = useState<Data>([]);
  return (
    <main className={Font.className}>
      {!isFileUploaded ? (
        <FileUploader
          setIsFileUploaded={setIsFileUploaded}
          setData={(data: Data) => setData(data)}
        />
      ) : (
        <Visualizer data={data} />
      )}
    </main>
  );
}

const FileUploader = (props: {
  setIsFileUploaded: Dispatch<SetStateAction<boolean>>;
  setData: { (data: Data): void };
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const loadFile = async () => {
    if (inputRef.current == null) return;
    if (inputRef.current.files?.length !== 1) return;
    const file = inputRef.current.files[0];
    const text = await file.text();

    const rows: {
      id: string;
      "room_id/id": string;
      noted_date: string;
      temp: string;
      "out/in": "In" | "Out";
    }[] = csv.parse(text, { columns: true });

    const data: Data = rows.map((row) => ({
      date: dateFns.parse(row["noted_date"], "dd-MM-yyyy HH:mm", new Date()),
      temperature: parseInt(row["temp"]),
      place: row["out/in"],
    }));
    props.setData(data);
  };
  return (
    <div className="fill file-uploader">
      <label>
        Click here to browse files
        <br />
        or
        <br />
        Drag and drop file here
        <input
          type="file"
          ref={inputRef}
          onChange={(e) => {
            props.setIsFileUploaded(true);
            loadFile();
          }}
        />
      </label>
    </div>
  );
};
