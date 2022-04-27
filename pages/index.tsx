import type { NextPage } from "next";
import { useRouter } from "next/router";
import React, { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import { DemoComponent, ExecutionMode } from "@lib/rayon-nbody-demo/main";

const Home: NextPage = () => {
  const router = useRouter();
  const { mode, numBodies } = router.query;

  return (
    <div className="container">
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <h1 className="title navbar-item">Rayon NBody Demo</h1>
        </div>
        <div className="navbar-menu">
          <div className="navbar-start">
            <Link href={"https://github.com/y3km21/next-rayon-nbody-demo"}>
              <a className="navbar-item">Source</a>
            </Link>
          </div>
        </div>
      </nav>
      <FormComponent
        currentModeStr={parseModeStr(mode as string)}
        numBodies={numBodies as string}
      ></FormComponent>
      <DemoComponent
        key={Date.now()}
        mode={parseMode(mode as string)}
        numBodies={parseIntWithDef(numBodies as string, 1500)}
      ></DemoComponent>
    </div>
  );
};

export default Home;

/**
 * Form Component
 * @param props
 * @returns
 */
const FormComponent = (props: {
  currentModeStr: string;
  numBodies: string;
}) => {
  const [_numBodies, setNumBodies] = useState(
    parseIntWithDef(props.numBodies as string, 1500)
  );

  useEffect(() => {
    setNumBodies(() => {
      return parseIntWithDef(props.numBodies as string, 1500);
    });
  }, [props.numBodies]);

  const ModeSelector = () => {
    return (
      <div className="level-item">
        <div className="field">
          <label className="label">Mode :</label>
          <div className="tabs is-toggle">
            <ul>
              {Object.entries(ExecutionMode)
                .filter(([, value]) => {
                  return typeof value === "string";
                })
                .map(([key, value]) => {
                  return (
                    <li
                      key={key}
                      className={
                        parseInt(key) === parseMode(props.currentModeStr)
                          ? "is-active"
                          : ""
                      }
                    >
                      <Link href={`/?mode=${value}&numBodies=${_numBodies}`}>
                        <a>{value}</a>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="level">
        <div className="level-left">
          <ModeSelector></ModeSelector>
          <FormNumBodies
            currentModeStr={props.currentModeStr}
            _numBodies={_numBodies}
            onChangeCb={(ev) => {
              setNumBodies((prev) => {
                if (ev.target.value.length === 0) {
                  return 0;
                }

                if (ev.target.value.length > 6) {
                  return prev;
                }

                const parsed = parseInt(ev.target.value);
                return isNaN(parsed) ? prev : parsed;
              });
            }}
          ></FormNumBodies>
        </div>
      </div>
    </div>
  );
};

const FormNumBodies = (props: {
  currentModeStr: string;
  _numBodies: number;
  onChangeCb: (ev: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
      }}
      className="level-item"
    >
      <div className="field">
        <label className="label">Number of Bodies :</label>
        <div className="level-item">
          <input
            className="input"
            type="text"
            name="numBodies"
            value={props._numBodies}
            onChange={props.onChangeCb}
          />
          <Link
            href={`/?mode=${props.currentModeStr}&numBodies=${props._numBodies}`}
          >
            <a>
              <input type="submit" value="Set" className="button is-link" />
            </a>
          </Link>
        </div>
      </div>
    </form>
  );
};

const parseMode = (modeStr: string) => {
  switch (modeStr) {
    case "Par":
      return ExecutionMode.Par;
    case "ParReduce":
      return ExecutionMode.ParReduce;
    case "Seq":
      return ExecutionMode.Seq;
    default:
      return ExecutionMode.Par;
  }
};

const parseModeStr = (modeStr: string) => {
  switch (modeStr) {
    case "Par":
      return modeStr;
    case "ParReduce":
      return modeStr;
    case "Seq":
      return modeStr;
    default:
      return "Par";
  }
};

const parseIntWithDef = (str: string, def: number) => {
  const parsed = parseInt(str);
  return isNaN(parsed) ? def : parsed;
};
