"use client";

import { Provider } from "react-redux";
import store from "@/redux/store";
import React from "react";

const ClientProvider = ({ children }: { children: React.ReactNode }) => {
  return <Provider store={store}>{children}</Provider>;
};

export default ClientProvider;
