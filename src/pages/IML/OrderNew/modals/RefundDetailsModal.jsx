// Auto-extracted from OrdersManagement.jsx
import { useState } from "react";

export default function RefundDetailsModal({ orders, refundDetailsModal, setRefundDetailsModal }) {
  if (!refundDetailsModal.isOpen) return null;

  const refundedOrders = JSON.parse(localStorage.getItem("imlorders_refunded") || "[]");
  const storedReadIds = JSON.parse(localStorage.getItem("imlorders_refunded_read") || "[]");

  const [expandedCards, setExpandedCards] = useState(() => ({}));
  const [readIds, setReadIds] = useState(() => new Set(storedReadIds));

  const getKey = (order, idx) => order.id || order.orderNumber || String(idx);

  const isRead = (order, idx) => readIds.has(getKey(order, idx));

  const unreadCount = refundedOrders.filter((o, i) => !isRead(o, i)).length;

  const toggleCard = (idx) =>
    setExpandedCards(prev => ({ ...prev, [idx]: !prev[idx] }));

  const markOneRead = (order, idx) => {
    const key = getKey(order, idx);
    const next = new Set(readIds);
    next.add(key);
    setReadIds(next);
    localStorage.setItem("imlorders_refunded_read", JSON.stringify([...next]));
  };

  const markAllRead = () => {
    const allKeys = refundedOrders.map((o, i) => getKey(o, i));
    const next = new Set(allKeys);
    setReadIds(next);
    localStorage.setItem("imlorders_refunded_read", JSON.stringify([...next]));
  };

  const fmtDate = (ts) =>
    ts ? new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="fixed inset-0 bg-[#000000b3] z-[50009] flex items-center justify-center p-[1.5vw]">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-[1.5vw] py-[1.1vw] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-[1.2vw] font-bold text-white flex items-center gap-[0.6vw]">
              💰 Order Refund Details
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[0.65vw] font-bold rounded-full min-w-[1.3vw] h-[1.3vw] flex items-center justify-center px-[0.3vw] shadow">
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="text-[0.78vw] text-emerald-100 mt-[0.15vw]">
              {refundedOrders.length} record{refundedOrders.length !== 1 ? "s" : ""} total · {unreadCount} unread
            </p>
          </div>
          <div className="flex items-center gap-[0.75vw]">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="px-[0.9vw] py-[0.4vw] bg-white/20 hover:bg-white/30 border border-white/40 text-white text-[0.78vw] font-semibold rounded-lg cursor-pointer transition-all"
              >
                ✓ Mark All as Read
              </button>
            )}
            <button
              onClick={() => setRefundDetailsModal({ isOpen: false })}
              className="text-white hover:text-emerald-200 text-[1.8vw] font-bold cursor-pointer leading-none"
            >×</button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-[1.5vw] space-y-[0.7vw]">
          {refundedOrders.length === 0 ? (
            <div className="text-center py-[5vw]">
              <div className="text-[3vw] mb-[1vw]">💸</div>
              <h3 className="text-[1.1vw] font-bold text-gray-700 mb-[0.4vw]">No Refund Records</h3>
              <p className="text-[0.9vw] text-gray-500">No orders have been deleted with refund details yet.</p>
            </div>
          ) : (
            refundedOrders.map((order, idx) => {
              const expanded = !!expandedCards[idx];
              const read = isRead(order, idx);
              const imlType = "";

              return (
                <div
                  key={idx}
                  className={`rounded-xl border-2 overflow-hidden transition-all duration-200 ${read ? "border-gray-200 bg-white" : "border-emerald-300 bg-emerald-50/20"}`}
                >
                  {/* ── Accordion header (always visible) ── */}
                  <div
                    className={`flex items-center justify-between px-[1.25vw] py-[0.8vw] cursor-pointer select-none transition-colors ${read ? "bg-gray-50 hover:bg-gray-100" : "bg-emerald-50 hover:bg-emerald-100"}`}
                    onClick={() => toggleCard(idx)}
                  >
                    {/* Left: dot + order info */}
                    <div className="flex items-center gap-[0.7vw] flex-1 min-w-0">
                      <div className={`w-[0.55vw] h-[0.55vw] rounded-full flex-shrink-0 mt-[0.1vw] ${read ? "bg-gray-300" : "bg-emerald-500 shadow-sm"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-[0.65vw] flex-wrap">
                          <span className="text-[0.95vw] font-bold text-gray-800">
                            🗑️ {order.orderNumber || order.id}
                          </span>
                          {!read && (
                            <span className="px-[0.45vw] py-[0.08vw] bg-emerald-500 text-white text-[0.65vw] font-bold rounded-full">
                              NEW
                            </span>
                          )}
                          <span className="text-[0.78vw] text-gray-500">
                            <strong className="text-gray-700">{order.contact?.company}</strong>
                            {order.contact?.contactName ? ` — ${order.contact.contactName}` : ""}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-[1vw] mt-[0.2vw]">
                          <span className="text-[0.72vw] text-gray-400">📅 {fmtDate(order.deleteRequestedAt)}</span>
                          <span className="text-[0.72vw] text-gray-400">📦 {order.products?.length || 0} product(s)</span>
                          {order.orderEstimate?.estimatedValue && (
                            <span className="text-[0.72vw] text-gray-400">
                              💵 ₹{Number(order.orderEstimate.estimatedValue).toLocaleString()}
                            </span>
                          )}
                          {order.paymentRecords?.length > 0 && (
                            <span className="text-[0.72vw] text-gray-400">
                              💳 {order.paymentRecords.length} payment(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: mark-read + chevron */}
                    <div className="flex items-center gap-[0.6vw] ml-[1vw] flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {read ? (
                        <span className="text-[0.72vw] text-gray-400 font-medium flex items-center gap-[0.25vw]">
                          <span className="text-emerald-500">✓</span> Read
                        </span>
                      ) : (
                        <button
                          onClick={() => markOneRead(order, idx)}
                          className="px-[0.7vw] py-[0.28vw] bg-emerald-600 hover:bg-emerald-700 text-white text-[0.72vw] font-semibold rounded-md cursor-pointer transition-all"
                        >
                          Mark Read
                        </button>
                      )}
                      <div
                        onClick={() => toggleCard(idx)}
                        className="w-[1.6vw] h-[1.6vw] flex items-center justify-center rounded-md bg-gray-200 hover:bg-gray-300 cursor-pointer transition-all"
                      >
                        <svg
                          className={`w-[0.8vw] h-[0.8vw] text-gray-600 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* ── Accordion body (shown when expanded) ── */}
                  {expanded && (
                    <div className="border-t border-gray-200 bg-white p-[1.25vw] space-y-[1vw]">

                      {/* Estimate + Contact strip */}
                      <div className="grid grid-cols-4 gap-[0.75vw] bg-gray-50 rounded-lg px-[1vw] py-[0.7vw]">
                        <div>
                          <p className="text-[0.68vw] text-gray-400 uppercase tracking-wide font-medium">Estimate No.</p>
                          <p className="text-[0.85vw] font-semibold text-gray-800">{order.orderEstimate?.estimatedNumber || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[0.68vw] text-gray-400 uppercase tracking-wide font-medium">Estimate Value</p>
                          <p className="text-[0.85vw] font-semibold text-blue-700">₹{(Number(order.orderEstimate?.estimatedValue) || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[0.68vw] text-gray-400 uppercase tracking-wide font-medium">Phone</p>
                          <p className="text-[0.85vw] font-semibold text-gray-800">{order.contact?.phone || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[0.68vw] text-gray-400 uppercase tracking-wide font-medium">Priority</p>
                          <p className="text-[0.85vw] font-semibold text-gray-800 capitalize">{order.contact?.priority || "—"}</p>
                        </div>
                      </div>

                      {/* Deletion reason */}
                      {order.deletionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-[1vw] py-[0.65vw]">
                          <p className="text-[0.68vw] text-red-500 font-semibold uppercase tracking-wide mb-[0.25vw]">
                            🗑️ Reason for Deletion
                          </p>
                          <p className="text-[0.85vw] text-gray-800">{order.deletionReason}</p>
                        </div>
                      )}

                      {/* Refund info */}
                      {order.refundInfo && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg px-[1vw] py-[0.65vw] space-y-[0.4vw]">
                          <p className="text-[0.68vw] text-orange-500 font-semibold uppercase tracking-wide">💰 Refund Details</p>
                          <div>
                            <p className="text-[0.68vw] text-gray-400">Remarks</p>
                            <p className="text-[0.85vw] text-gray-800">{order.refundInfo.remarks}</p>
                          </div>
                          {order.refundInfo.documentName && (
                            <div className="flex items-center gap-[0.5vw]">
                              <span className="text-[0.72vw] text-gray-400">Document:</span>
                              <a
                                href={order.refundInfo.document}
                                download={order.refundInfo.documentName}
                                className="text-[0.8vw] text-blue-600 hover:text-blue-800 underline"
                              >
                                📎 {order.refundInfo.documentName}
                              </a>
                            </div>
                          )}
                          <p className="text-[0.68vw] text-gray-400">Submitted: {fmtDate(order.refundInfo.submittedAt)}</p>
                        </div>
                      )}

                      {/* ── Products table — matches main orders view ── */}
                      {order.products && order.products.length > 0 && (
                        <div>
                          <p className="text-[0.8vw] font-semibold text-gray-700 mb-[0.4vw]">
                            Products ({order.products.length})
                          </p>
                          <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full border-collapse text-[0.78vw]">
                              <thead>
                                <tr className="bg-gray-200">
                                  <th className="border border-gray-300 px-[0.75vw] py-[0.55vw] text-left font-semibold text-gray-700">S.No</th>
                                  <th className="border border-gray-300 px-[0.75vw] py-[0.55vw] text-left font-semibold text-gray-700">Product Name</th>
                                  <th className="border border-gray-300 px-[0.75vw] py-[0.55vw] text-left font-semibold text-gray-700">Size</th>
                                  <th className="border border-gray-300 px-[0.75vw] py-[0.55vw] text-left font-semibold text-gray-700">IML Name</th>
                                  <th className="border border-gray-300 px-[0.75vw] py-[0.55vw] text-left font-semibold text-gray-700">IML Type</th>
                                  <th className="border border-gray-300 px-[0.75vw] py-[0.55vw] text-left font-semibold text-gray-700">LID Order Qty</th>
                                  <th className="border border-gray-300 px-[0.75vw] py-[0.55vw] text-left font-semibold text-gray-700">TUB Order Qty</th>
                                  <th className="border border-gray-300 px-[0.75vw] py-[0.55vw] text-center font-semibold text-gray-700">Order Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.products.map((p, pidx) => {
                                  const t = (p.imlType || "").toUpperCase();
                                  const hasLid = t.includes("LID");
                                  const hasTub = t.includes("TUB");
                                  return (
                                    <tr key={pidx} className="hover:bg-gray-50">
                                      <td className="border border-gray-300 px-[0.75vw] py-[0.55vw] text-gray-500">{pidx + 1}</td>
                                      <td className="border border-gray-300 px-[0.75vw] py-[0.55vw] font-medium text-gray-800">{p.productName || "N/A"}</td>
                                      <td className="border border-gray-300 px-[0.75vw] py-[0.55vw] text-gray-700">{p.size || "N/A"}</td>
                                      <td className="border border-gray-300 px-[0.75vw] py-[0.55vw] text-gray-700">{p.imlName || "N/A"}</td>
                                      <td className="border border-gray-300 px-[0.75vw] py-[0.55vw]">
                                        <span className="inline-block px-[0.4vw] py-[0.15vw] bg-blue-100 text-blue-700 rounded font-semibold whitespace-pre">
                                          {p.imlType || "N/A"}
                                        </span>
                                      </td>
                                      <td className="border border-gray-300 px-[0.75vw] py-[0.55vw] font-semibold text-gray-800">
                                        {hasLid ? (p.lidLabelQty || "—") : <span className="text-gray-300 font-normal">—</span>}
                                      </td>
                                      <td className="border border-gray-300 px-[0.75vw] py-[0.55vw] font-semibold text-gray-800">
                                        {hasTub ? (p.tubLabelQty || "—") : <span className="text-gray-300 font-normal">—</span>}
                                      </td>
                                      <td className="border border-gray-300 px-[0.75vw] py-[0.55vw] text-center">
                                        <span className={`inline-block px-[0.5vw] py-[0.2vw] rounded text-[0.72vw] font-semibold whitespace-pre ${p.orderStatus === "Artwork Approved" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                          {p.orderStatus || "Artwork Pending"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Payment Records */}
                      {order.paymentRecords && order.paymentRecords.length > 0 && (
                        <div>
                          <p className="text-[0.8vw] font-semibold text-gray-700 mb-[0.4vw]">
                            Payment Records ({order.paymentRecords.length})
                          </p>
                          <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full border-collapse text-[0.78vw]">
                              <thead>
                                <tr className="bg-green-50">
                                  <th className="border border-gray-200 px-[0.75vw] py-[0.5vw] text-left font-semibold text-gray-700">Type</th>
                                  <th className="border border-gray-200 px-[0.75vw] py-[0.5vw] text-left font-semibold text-gray-700">Method</th>
                                  <th className="border border-gray-200 px-[0.75vw] py-[0.5vw] text-left font-semibold text-gray-700">Amount</th>
                                  <th className="border border-gray-200 px-[0.75vw] py-[0.5vw] text-left font-semibold text-gray-700">Remarks</th>
                                  <th className="border border-gray-200 px-[0.75vw] py-[0.5vw] text-left font-semibold text-gray-700">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.paymentRecords.map((rec, ridx) => (
                                  <tr key={ridx} className="hover:bg-gray-50">
                                    <td className="border border-gray-200 px-[0.75vw] py-[0.5vw] capitalize">{rec.paymentType}</td>
                                    <td className="border border-gray-200 px-[0.75vw] py-[0.5vw]">{rec.method || "—"}</td>
                                    <td className="border border-gray-200 px-[0.75vw] py-[0.5vw] font-semibold text-green-700">
                                      {rec.paymentType === "advance" ? `₹${parseFloat(rec.amount || 0).toLocaleString()}` : "PO"}
                                    </td>
                                    <td className="border border-gray-200 px-[0.75vw] py-[0.5vw]">{rec.remarks || "—"}</td>
                                    <td className="border border-gray-200 px-[0.75vw] py-[0.5vw] text-gray-500">{fmtDate(rec.timestamp)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 px-[1.5vw] py-[1vw] border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-[0.78vw] text-gray-500">
            {refundedOrders.length} record(s) · {unreadCount} unread
          </p>
          <button
            onClick={() => setRefundDetailsModal({ isOpen: false })}
            className="px-[1.5vw] py-[0.55vw] bg-gray-600 text-white rounded-lg text-[0.85vw] font-semibold hover:bg-gray-700 cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
