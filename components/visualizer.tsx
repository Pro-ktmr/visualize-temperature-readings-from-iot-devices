import { Data, Datum } from "@/lib/interfaces";
import * as dateFns from "date-fns";
import groupBy from "lodash.groupby";
import { Component, useState } from "react";

const THRESHOLD_DATA_NUM = 3;
const GRAPH_AREA_HEIGHT = 300;
const PLOT_SIZE = 6;

interface Props {
  data: Data;
}

interface State {
  hours: string[];
  averageIn: { [hour: string]: number };
  averageOut: { [hour: string]: number };
  hoveredHour: string;
}

export class Visualizer extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hours: [], averageIn: {}, averageOut: {}, hoveredHour: "" };
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (JSON.stringify(prevProps.data) !== JSON.stringify(this.props.data)) {
      const groups: { [hour: string]: { In: Datum[]; Out: Datum[] } } =
        Object.fromEntries(
          Object.entries(
            groupBy(this.props.data, (datum) =>
              dateFns.format(datum.date, "yyyy-MM-dd HH")
            )
          )
            .map(([key, group]) => [key, groupBy(group, "place")])
            .filter(
              ([_, group]) =>
                Object.keys(group).length === 2 &&
                (group as { In: Datum[]; Out: Datum[] })["In"].length >=
                  THRESHOLD_DATA_NUM &&
                (group as { In: Datum[]; Out: Datum[] })["Out"].length >=
                  THRESHOLD_DATA_NUM
            )
        );
      console.log(groups);

      const hours = Object.keys(groups).toSorted();
      const averageIn = Object.fromEntries(
        Object.entries(groups).map(([key, group]) => [
          key,
          Math.round(
            this.average(group["In"].map((datum) => datum.temperature)) * 100
          ) / 100,
        ])
      );
      const averageOut = Object.fromEntries(
        Object.entries(groups).map(([key, group]) => [
          key,
          Math.round(
            this.average(group["Out"].map((datum) => datum.temperature)) * 100
          ) / 100,
        ])
      );

      this.setState({
        hours: hours,
        averageIn: averageIn,
        averageOut: averageOut,
      });
    }
  }

  render() {
    return (
      <View
        hours={this.state.hours}
        averageIn={this.state.averageIn}
        averageOut={this.state.averageOut}
      />
    );
  }

  private average(arr: number[]) {
    return arr.reduce((c, v) => c + v) / arr.length;
  }
}

const View = (props: {
  hours: string[];
  averageIn: { [hour: string]: number };
  averageOut: { [hour: string]: number };
}) => {
  const [hoveredHour, setHoveredHour] = useState("");

  const minTemperature = Math.min(
    ...Object.values(props.averageIn),
    ...Object.values(props.averageOut)
  );
  const maxTemperature = Math.max(
    ...Object.values(props.averageIn),
    ...Object.values(props.averageOut)
  );

  const calcX = (hour: string) => {
    const firstStep = dateFns
      .parse(props.hours[0], "yyyy-MM-dd HH", new Date())
      .getTime();
    const currentStep = dateFns
      .parse(hour, "yyyy-MM-dd HH", new Date())
      .getTime();
    return ((currentStep - firstStep) / (1000 * 60 * 60)) * PLOT_SIZE;
  };
  const calcY = (temperature: number) => {
    return (
      GRAPH_AREA_HEIGHT -
      ((temperature - minTemperature) / (maxTemperature - minTemperature)) *
        GRAPH_AREA_HEIGHT
    );
  };

  return (
    <>
      <div className="houseArea"></div>
      <div className="graphArea">
        {props.hours.map((hour) => (
          <div
            className={"column" + (hoveredHour === hour ? " hovered" : "")}
            style={{
              left: calcX(hour) + "px",
            }}
            onMouseEnter={(e) => {
              setHoveredHour(hour);
            }}
          >
            <span
              className="plot red"
              style={{
                top: calcY(props.averageIn[hour]) + "px",
              }}
            ></span>
            <span
              className="plot blue"
              style={{
                top: calcY(props.averageOut[hour]) + "px",
              }}
            ></span>
            <div className="description">
              <strong>{hour}:**:**</strong>
              <table>
                <tr>
                  <th>In</th>
                  <td>{props.averageIn[hour].toFixed(2)}</td>
                </tr>
                <tr>
                  <th>Out</th>
                  <td>{props.averageOut[hour].toFixed(2)}</td>
                </tr>
              </table>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
