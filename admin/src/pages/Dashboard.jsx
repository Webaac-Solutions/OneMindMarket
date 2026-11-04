import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCustomers,
  getCategories,
  getLocations,
  getEnquiries,
  getCustomerStats,
} from "../services/adminService";
import { useToast } from "../components/Toast";
import Loader from "../components/Loader";
import "./Admin.css";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      getCustomers(),
      getCategories(),
      getLocations(),
      getEnquiries(),
      getCustomerStats().catch(() => ({})),
    ])
      .then(([customers, categories, locations, enquiries, stats]) => {
        setData({ customers, categories, locations, enquiries, stats });
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load dashboard");
        setData({
          customers: [],
          categories: [],
          locations: [],
          enquiries: [],
          stats: {},
        });
      });
  }, []);

  if (!data) return <Loader label="Loading dashboard..." />;

  const { customers, categories, locations, enquiries, stats } = data;
  const statValues = Object.values(stats);
  const totalCalls = statValues.reduce((n, s) => n + (s.callCount || 0), 0);
  const totalVisits = statValues.reduce((n, s) => n + (s.visitCount || 0), 0);
  const activeCount = customers.filter((c) => c.isActive !== false).length;
  const pendingCount = enquiries.filter((e) => !e.handled).length;

  const recentEnquiries = [...enquiries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const topBusinesses = customers
    .map((c) => ({ ...c, visits: stats[c._id]?.visitCount || 0 }))
    .filter((c) => c.visits > 0)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  const cards = [
    {
      label: "Customers",
      value: customers.length,
      sub: `${activeCount} active`,
      to: "/customers",
    },
    { label: "Categories", value: categories.length, to: "/add-category" },
    { label: "Locations", value: locations.length, to: "/add-location" },
    {
      label: "Enquiries",
      value: enquiries.length,
      sub: `${pendingCount} pending`,
      to: "/AdminEnquiries",
    },
    { label: "Calls", value: totalCalls },
    { label: "Profile Views", value: totalVisits },
  ];

  return (
    <div className="admin-page">
      <h2 className="admin-title">Dashboard</h2>

      <div className="dash-grid">
        {cards.map((c) => {
          const inner = (
            <>
              <span className="dash-card-label">{c.label}</span>
              <span className="dash-card-value">{c.value}</span>
              {c.sub && <span className="dash-card-sub">{c.sub}</span>}
            </>
          );
          return c.to ? (
            <Link key={c.label} to={c.to} className="dash-card dash-card--link">
              {inner}
            </Link>
          ) : (
            <div key={c.label} className="dash-card">
              {inner}
            </div>
          );
        })}
      </div>

      <div className="dash-panels">
        <div className="dash-panel">
          <h3 className="dash-panel-title">Recent Enquiries</h3>
          {recentEnquiries.length === 0 ? (
            <p className="dash-empty">No enquiries yet</p>
          ) : (
            recentEnquiries.map((e) => (
              <div key={e._id} className="dash-row">
                <div className="dash-row-main">
                  <span className="dash-row-title">
                    {e.shop?.shopName || "-"}
                  </span>
                  <span className="dash-row-sub">
                    {e.name} &middot; {e.phone}
                  </span>
                </div>
                <span className="dash-row-meta">
                  {new Date(e.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="dash-panel">
          <h3 className="dash-panel-title">Most Viewed Businesses</h3>
          {topBusinesses.length === 0 ? (
            <p className="dash-empty">No visits recorded yet</p>
          ) : (
            topBusinesses.map((c) => (
              <div key={c._id} className="dash-row">
                <div className="dash-row-main">
                  <span className="dash-row-title">{c.shopName}</span>
                  <span className="dash-row-sub">
                    {c.category?.name || "-"}
                  </span>
                </div>
                <span className="dash-row-meta">{c.visits} views</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
