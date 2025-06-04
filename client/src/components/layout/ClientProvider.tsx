"use client";

import { Provider } from "react-redux";
import store from "@/redux/store";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUserRequest } from "@/redux/authSlice";
import { RootState } from "@/redux/store";

const AuthHydrator = () => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  useEffect(() => {
    if (token && !user) {
      dispatch(getCurrentUserRequest());
    }
  }, [token, user, dispatch]);
  return null;
};

const ClientProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <AuthHydrator />
      {children}
    </Provider>
  );
};

export default ClientProvider;
