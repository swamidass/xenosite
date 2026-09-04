import { describe, expect, it } from "vitest";
import hop1 from "~/molecule-focus/hopRoute1";
import hop2 from "~/molecule-focus/hopRoute2";
import hop3 from "~/molecule-focus/hopRoute3";
import hop4 from "~/molecule-focus/hopRoute4";
import {
  loader as hop1Loader,
  shouldRevalidate as hop1Revalidate,
} from "~/molecule-focus/hopRoute1";
import met1 from "~/molecule-focus/metaboliteRoute1";
import met2 from "~/molecule-focus/metaboliteRoute2";
import met3 from "~/molecule-focus/metaboliteRoute3";
import met4 from "~/molecule-focus/metaboliteRoute4";
import {
  loader as met1Loader,
  shouldRevalidate as met1Revalidate,
} from "~/molecule-focus/metaboliteRoute1";
import MoleculeFocusIndex from "~/molecule-focus/index";
import { EMPTY_HOP_OUTLET_CONTEXT } from "~/molecule-focus/hopOutletContext";
import * as queryRoute from "~/routes/_model.$model.$query";
import * as queryIndex from "~/routes/_model.$model.$query._index";
import * as met1Route from "~/routes/_model.$model.$query.$met1";
import * as hop1Route from "~/routes/_model.$model.$query.$met1.$m1.$q1";
import * as met2Route from "~/routes/_model.$model.$query.$met1.$m1.$q1.$met2";
import * as hop2Route from "~/routes/_model.$model.$query.$met1.$m1.$q1.$met2.$m2.$q2";
import * as met3Route from "~/routes/_model.$model.$query.$met1.$m1.$q1.$met2.$m2.$q2.$met3";
import * as hop3Route from "~/routes/_model.$model.$query.$met1.$m1.$q1.$met2.$m2.$q2.$met3.$m3.$q3";
import * as met4Route from "~/routes/_model.$model.$query.$met1.$m1.$q1.$met2.$m2.$q2.$met3.$m3.$q3.$met4";
import * as hop4Route from "~/routes/_model.$model.$query.$met1.$m1.$q1.$met2.$m2.$q2.$met3.$m3.$q3.$met4.$m4.$q4";

describe("nested hop route modules", () => {
  it("export loaders, revalidators, and a default component", () => {
    expect(typeof hop1).toBe("function");
    expect(typeof hop2).toBe("function");
    expect(typeof hop3).toBe("function");
    expect(typeof hop4).toBe("function");
    expect(typeof hop1Loader).toBe("function");
    expect(typeof hop1Revalidate).toBe("function");
    expect(typeof met1).toBe("function");
    expect(typeof met2).toBe("function");
    expect(typeof met3).toBe("function");
    expect(typeof met4).toBe("function");
    expect(typeof met1Loader).toBe("function");
    expect(typeof met1Revalidate).toBe("function");
    expect(MoleculeFocusIndex()).toBeNull();
    expect(EMPTY_HOP_OUTLET_CONTEXT.formationForChild).toBeNull();
  });

  it("re-exports nested Remix route modules", () => {
    expect(typeof queryRoute.loader).toBe("function");
    expect(typeof queryRoute.meta).toBe("function");
    expect(queryIndex.default()).toBeNull();
    expect(typeof met1Route.loader).toBe("function");
    expect(typeof hop1Route.loader).toBe("function");
    expect(typeof met2Route.loader).toBe("function");
    expect(typeof hop2Route.loader).toBe("function");
    expect(typeof met3Route.loader).toBe("function");
    expect(typeof hop3Route.loader).toBe("function");
    expect(typeof hop4Route.loader).toBe("function");
    expect(typeof met4Route.loader).toBe("function");
  });
});
