import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./pages/AdminLayout";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import AddCategory from "./pages/AddCategory";
import AddLocation from "./pages/AddLocation";
import ManageCustomers from "./pages/ManageCustomers";
import CustomerForm from "./pages/CustomerForm";
import ViewJoinRequests from "./pages/ViewJoinRequests";
import AdminEnquiries from "./pages/AdminEnquiries";
import ManageArticles from "./pages/ManageArticles";
import ArticleForm from "./pages/ArticleForm";
import ManageGallery from "./pages/ManageGallery";
import GalleryForm from "./pages/GalleryForm";
import AdminNotifications from "./pages/AdminNotifications";
import { ToastProvider } from "./components/Toast";
import { ConfirmProvider } from "./components/ConfirmDialog";
import "./App.css";

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <div>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="add-category" element={<AddCategory />} />
              <Route path="add-location" element={<AddLocation />} />
              <Route path="customers" element={<ManageCustomers />} />
              <Route path="customers/new" element={<CustomerForm />} />
              <Route path="customers/edit/:id" element={<CustomerForm />} />
              <Route path="view-join-requests" element={<ViewJoinRequests />} />
              <Route path="AdminEnquiries" element={<AdminEnquiries />} />
              <Route path="articles" element={<ManageArticles />} />
              <Route path="articles/new" element={<ArticleForm />} />
              <Route path="articles/edit/:id" element={<ArticleForm />} />
              <Route path="gallery" element={<ManageGallery />} />
              <Route path="gallery/new" element={<GalleryForm />} />
              <Route path="gallery/edit/:id" element={<GalleryForm />} />
              <Route path="notifications" element={<AdminNotifications />} />
            </Route>
          </Routes>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
