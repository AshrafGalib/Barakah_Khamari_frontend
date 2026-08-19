import { useCallback, useEffect, useMemo, useState } from "react";

import api from "../services/api";

// ======================================================
// Permission Groups
// ======================================================

const PERMISSION_GROUPS = [
  {
    key: "dashboard",
    label: "Dashboard",
    permissions: [
      {
        key: "dashboard.view",
        label: "View Dashboard",
      },
    ],
  },

  {
    key: "pos",
    label: "POS",
    permissions: [
      {
        key: "pos.access",
        label: "Access POS",
      },
    ],
  },

  {
    key: "products",
    label: "Products",
    permissions: [
      {
        key: "products.view",
        label: "View Products",
      },
      {
        key: "products.create",
        label: "Create Products",
      },
      {
        key: "products.update",
        label: "Update Products",
      },
      {
        key: "products.delete",
        label: "Delete Products",
      },
    ],
  },

  {
    key: "categories",
    label: "Categories",
    permissions: [
      {
        key: "categories.view",
        label: "View Categories",
      },
      {
        key: "categories.create",
        label: "Create Categories",
      },
      {
        key: "categories.update",
        label: "Update Categories",
      },
      {
        key: "categories.delete",
        label: "Delete Categories",
      },
    ],
  },

  {
    key: "purchases",
    label: "Purchases",
    permissions: [
      {
        key: "purchases.view",
        label: "View Purchases",
      },
      {
        key: "purchases.create",
        label: "Create Purchases",
      },
      {
        key: "purchases.update",
        label: "Update Purchases",
      },
      {
        key: "purchases.delete",
        label: "Delete Purchases",
      },
    ],
  },

  {
    key: "sales",
    label: "Sales",
    permissions: [
      {
        key: "sales.view",
        label: "View Sales",
      },
      {
        key: "sales.create",
        label: "Create Sales",
      },
      {
        key: "sales.update",
        label: "Update Sales",
      },
      {
        key: "sales.delete",
        label: "Delete Sales",
      },
    ],
  },

  {
    key: "customers",
    label: "Customers",
    permissions: [
      {
        key: "customers.view",
        label: "View Customers",
      },
      {
        key: "customers.create",
        label: "Create Customers",
      },
      {
        key: "customers.update",
        label: "Update Customers",
      },
      {
        key: "customers.delete",
        label: "Delete Customers",
      },
      {
        key: "customers.duePayment",
        label: "Customer Due Payment",
      },
    ],
  },

  {
    key: "suppliers",
    label: "Suppliers",
    permissions: [
      {
        key: "suppliers.view",
        label: "View Suppliers",
      },
      {
        key: "suppliers.create",
        label: "Create Suppliers",
      },
      {
        key: "suppliers.update",
        label: "Update Suppliers",
      },
      {
        key: "suppliers.delete",
        label: "Delete Suppliers",
      },
    ],
  },

  {
    key: "inventory",
    label: "Inventory",
    permissions: [
      {
        key: "inventory.view",
        label: "View Inventory",
      },
    ],
  },

  {
    key: "expenses",
    label: "Expenses",
    permissions: [
      {
        key: "expenses.view",
        label: "View Expenses",
      },
      {
        key: "expenses.create",
        label: "Create Expenses",
      },
      {
        key: "expenses.update",
        label: "Update Expenses",
      },
      {
        key: "expenses.delete",
        label: "Delete Expenses",
      },
    ],
  },

  {
    key: "reports",
    label: "Reports",
    permissions: [
      {
        key: "reports.view",
        label: "View Reports",
      },
    ],
  },

  {
    key: "cashBalance",
    label: "Cash Balance",
    permissions: [
      {
        key: "cashBalance.view",
        label: "View Cash Balance",
      },
      {
        key: "cashBalance.opening",
        label: "Set Opening Balance",
      },
      {
        key: "cashBalance.adjust",
        label: "Adjust Cash Balance",
      },
    ],
  },

  {
    key: "users",
    label: "Users",
    permissions: [
      {
        key: "users.view",
        label: "View Users",
      },
      {
        key: "users.create",
        label: "Create Users",
      },
      {
        key: "users.update",
        label: "Update Users",
      },
      {
        key: "users.delete",
        label: "Deactivate Users",
      },
    ],
  },

  {
    key: "roles",
    label: "Roles",
    permissions: [
      {
        key: "roles.view",
        label: "View Roles",
      },
      {
        key: "roles.create",
        label: "Create Roles",
      },
      {
        key: "roles.update",
        label: "Update Roles",
      },
      {
        key: "roles.delete",
        label: "Delete Roles",
      },
    ],
  },
];

// ======================================================
// Helpers
// ======================================================

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(
  (group) => group.permissions.map((permission) => permission.key)
);

const getResponseData = (response) => {
  return response?.data ?? response ?? {};
};

const getRolesFromResponse = (response) => {
  const data = getResponseData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.roles)) {
    return data.roles;
  }

  return [];
};

const getPermissionsFromResponse = (response) => {
  const data = getResponseData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.permissions)) {
    return data.permissions;
  }

  return [];
};

const normalizeRole = (role) => {
  return {
    ...role,

    permissions: Array.isArray(role?.permissions)
      ? role.permissions
      : [],

    isActive:
      role?.isActive !== false,
  };
};

// ======================================================
// Component
// ======================================================

function RoleManagement() {
  // ====================================================
  // State
  // ====================================================

  const [roles, setRoles] = useState([]);

  const [availablePermissions, setAvailablePermissions] =
    useState(ALL_PERMISSIONS);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingRole, setEditingRole] =
    useState(null);

  const [form, setForm] = useState({
    name: "",
    displayName: "",
    description: "",
    permissions: [],
  });

  // ====================================================
  // Load Roles
  // ====================================================

  const loadRoles = useCallback(async () => {
    try {
      setError("");

      const response =
        await api.get("/roles");

      const roleList =
        getRolesFromResponse(response);

      setRoles(
        roleList.map(normalizeRole)
      );
    } catch (err) {
      console.error(
        "Load roles error:",
        err
      );

      setError(
        err?.message ||
          "Roles load করা যায়নি"
      );
    }
  }, []);

  // ====================================================
  // Load Permissions
  // ====================================================

  const loadPermissions =
    useCallback(async () => {
      try {
        const response =
          await api.get(
            "/roles/permissions"
          );

        const permissions =
          getPermissionsFromResponse(
            response
          );

        if (
          permissions.length > 0
        ) {
          setAvailablePermissions(
            permissions
          );
        }
      } catch (err) {
        // If permission endpoint is unavailable,
        // use frontend constants as fallback.
        console.warn(
          "Permission API unavailable. Using local permission list.",
          err
        );

        setAvailablePermissions(
          ALL_PERMISSIONS
        );
      }
    }, []);

  // ====================================================
  // Initial Load
  // ====================================================

  useEffect(() => {
    const initialize =
      async () => {
        setLoading(true);

        await Promise.all([
          loadRoles(),
          loadPermissions(),
        ]);

        setLoading(false);
      };

    initialize();
  }, [
    loadRoles,
    loadPermissions,
  ]);

  // ====================================================
  // Form Helpers
  // ====================================================

  const resetForm = () => {
    setForm({
      name: "",
      displayName: "",
      description: "",
      permissions: [],
    });

    setEditingRole(null);
  };

  const openCreateModal = () => {
    resetForm();

    setError("");

    setSuccessMessage("");

    setShowModal(true);
  };

  const openEditModal = (
    role
  ) => {
    setEditingRole(role);

    setForm({
      name:
        role?.name || "",

      displayName:
        role?.displayName || "",

      description:
        role?.description || "",

      permissions:
        Array.isArray(
          role?.permissions
        )
          ? [...role.permissions]
          : [],
    });

    setError("");

    setSuccessMessage("");

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    resetForm();
  };

  // ====================================================
  // Input Change
  // ====================================================

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ====================================================
  // Permission Toggle
  // ====================================================

  const togglePermission = (
    permission
  ) => {
    setForm((previous) => {
      const exists =
        previous.permissions.includes(
          permission
        );

      return {
        ...previous,

        permissions: exists
          ? previous.permissions.filter(
              (item) =>
                item !== permission
            )
          : [
              ...previous.permissions,
              permission,
            ],
      };
    });
  };

  // ====================================================
  // Group Permission Helpers
  // ====================================================

  const getGroupPermissionKeys = (
    group
  ) => {
    return group.permissions
      .map(
        (permission) =>
          permission.key
      )
      .filter((permission) =>
        availablePermissions.includes(
          permission
        )
      );
  };

  const isGroupFullySelected = (
    group
  ) => {
    const keys =
      getGroupPermissionKeys(
        group
      );

    if (
      keys.length === 0
    ) {
      return false;
    }

    return keys.every(
      (permission) =>
        form.permissions.includes(
          permission
        )
    );
  };

  const isGroupPartiallySelected = (
    group
  ) => {
    const keys =
      getGroupPermissionKeys(
        group
      );

    const selected =
      keys.filter(
        (permission) =>
          form.permissions.includes(
            permission
          )
      );

    return (
      selected.length > 0 &&
      selected.length < keys.length
    );
  };

  const toggleGroup = (
    group
  ) => {
    const keys =
      getGroupPermissionKeys(
        group
      );

    const fullySelected =
      isGroupFullySelected(
        group
      );

    setForm((previous) => {
      if (fullySelected) {
        return {
          ...previous,

          permissions:
            previous.permissions.filter(
              (permission) =>
                !keys.includes(
                  permission
                )
            ),
        };
      }

      const merged =
        new Set(
          previous.permissions
        );

      keys.forEach(
        (permission) =>
          merged.add(
            permission
          )
      );

      return {
        ...previous,

        permissions:
          Array.from(merged),
      };
    });
  };

  // ====================================================
  // Select All
  // ====================================================

  const selectAllPermissions =
    () => {
      setForm((previous) => ({
        ...previous,

        permissions: [
          ...availablePermissions,
        ],
      }));
    };

  // ====================================================
  // Clear All
  // ====================================================

  const clearAllPermissions =
    () => {
      setForm((previous) => ({
        ...previous,

        permissions: [],
      }));
    };

  // ====================================================
  // Validation
  // ====================================================

  const validateForm = () => {
    const name =
      form.name.trim();

    const displayName =
      form.displayName.trim();

    if (!name) {
      return "Role name প্রয়োজন";
    }

    if (!/^[a-z0-9_-]+$/i.test(name)) {
      return "Role name শুধুমাত্র letters, numbers, underscore এবং hyphen ব্যবহার করতে পারবে";
    }

    if (!displayName) {
      return "Display name প্রয়োজন";
    }

    if (
      form.permissions.length ===
      0
    ) {
      return "কমপক্ষে একটি permission নির্বাচন করুন";
    }

    return "";
  };

  // ====================================================
  // Save Role
  // ====================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    setSuccessMessage("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );

      return;
    }

    setSaving(true);

    try {
      const payload = {
        name:
          form.name
            .trim()
            .toLowerCase(),

        displayName:
          form.displayName.trim(),

        description:
          form.description.trim(),

        permissions:
          form.permissions,
      };

      if (editingRole) {
        await api.patch(
          `/roles/${editingRole._id}`,
          payload
        );

        setSuccessMessage(
          "Role successfully updated"
        );
      } else {
        await api.post(
          "/roles",
          payload
        );

        setSuccessMessage(
          "Role successfully created"
        );
      }

      setShowModal(false);

      resetForm();

      await loadRoles();
    } catch (err) {
      console.error(
        "Save role error:",
        err
      );

      setError(
        err?.message ||
          "Role save করা যায়নি"
      );
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // Deactivate Role
  // ====================================================

  const handleDeactivate = async (
    role
  ) => {
    if (
      role?.isSystemRole
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `"${role.displayName || role.name}" role deactivate করতে চান?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      setSuccessMessage("");

      await api.delete(
        `/roles/${role._id}`
      );

      setSuccessMessage(
        "Role successfully deactivated"
      );

      await loadRoles();
    } catch (err) {
      console.error(
        "Deactivate role error:",
        err
      );

      setError(
        err?.message ||
          "Role deactivate করা যায়নি"
      );
    }
  };

  // ====================================================
  // Reactivate Role
  // ====================================================

  const handleReactivate = async (
    role
  ) => {
    if (
      role?.isSystemRole
    ) {
      return;
    }

    try {
      setError("");

      setSuccessMessage("");

      await api.patch(
        `/roles/${role._id}`,
        {
          isActive: true,
        }
      );

      setSuccessMessage(
        "Role successfully activated"
      );

      await loadRoles();
    } catch (err) {
      console.error(
        "Reactivate role error:",
        err
      );

      setError(
        err?.message ||
          "Role activate করা যায়নি"
      );
    }
  };

  // ====================================================
  // Permission Count
  // ====================================================

  const permissionCount =
    useMemo(() => {
      return form.permissions.length;
    }, [
      form.permissions,
    ]);

  // ====================================================
  // Render
  // ====================================================

  return (
    <div
      style={{
        padding: "24px",
        minHeight: "100%",
        background:
          "#f8fafc",
      }}
    >
      {/* ==================================================
          Header
          ================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: "16px",
          marginBottom:
            "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize:
                "28px",
              fontWeight:
                700,
              color:
                "#0f172a",
            }}
          >
            Role Management
          </h1>

          <p
            style={{
              margin:
                "6px 0 0",
              color:
                "#64748b",
              fontSize:
                "14px",
            }}
          >
            Manage roles and
            control system
            permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={
            openCreateModal
          }
          style={{
            border: "none",
            borderRadius:
              "10px",
            padding:
              "11px 18px",
            background:
              "#0f766e",
            color: "#fff",
            fontSize:
              "14px",
            fontWeight:
              600,
            cursor:
              "pointer",
          }}
        >
          + Create Role
        </button>
      </div>

      {/* ==================================================
          Error
          ================================================== */}

      {error && (
        <div
          style={{
            marginBottom:
              "16px",
            padding:
              "12px 14px",
            borderRadius:
              "8px",
            background:
              "#fef2f2",
            border:
              "1px solid #fecaca",
            color:
              "#b91c1c",
            fontSize:
              "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* ==================================================
          Success
          ================================================== */}

      {successMessage && (
        <div
          style={{
            marginBottom:
              "16px",
            padding:
              "12px 14px",
            borderRadius:
              "8px",
            background:
              "#f0fdf4",
            border:
              "1px solid #bbf7d0",
            color:
              "#15803d",
            fontSize:
              "14px",
          }}
        >
          {successMessage}
        </div>
      )}

      {/* ==================================================
          Loading
          ================================================== */}

      {loading ? (
        <div
          style={{
            background:
              "#fff",
            borderRadius:
              "12px",
            padding:
              "50px",
            textAlign:
              "center",
            color:
              "#64748b",
          }}
        >
          Loading roles...
        </div>
      ) : roles.length ===
        0 ? (
        /* ==================================================
            Empty State
            ================================================== */

        <div
          style={{
            background:
              "#fff",
            borderRadius:
              "12px",
            padding:
              "60px 20px",
            textAlign:
              "center",
            border:
              "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontSize:
                "42px",
              marginBottom:
                "12px",
            }}
          >
            👤
          </div>

          <h3
            style={{
              margin:
                "0 0 8px",
              color:
                "#0f172a",
            }}
          >
            No roles found
          </h3>

          <p
            style={{
              margin:
                "0 0 20px",
              color:
                "#64748b",
              fontSize:
                "14px",
            }}
          >
            Create your first
            custom role.
          </p>

          <button
            type="button"
            onClick={
              openCreateModal
            }
            style={{
              border: "none",
              borderRadius:
                "8px",
              padding:
                "10px 16px",
              background:
                "#0f766e",
              color:
                "#fff",
              fontWeight:
                600,
              cursor:
                "pointer",
            }}
          >
            Create Role
          </button>
        </div>
      ) : (
        /* ==================================================
            Role List
            ================================================== */

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "18px",
          }}
        >
          {roles.map(
            (role) => (
              <div
                key={
                  role._id
                }
                style={{
                  background:
                    "#fff",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius:
                    "12px",
                  padding:
                    "20px",
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.04)",
                  opacity:
                    role.isActive
                      ? 1
                      : 0.65,
                }}
              >
                {/* Role Header */}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "flex-start",
                    gap: "10px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin:
                          0,
                        color:
                          "#0f172a",
                        fontSize:
                          "18px",
                      }}
                    >
                      {role.displayName ||
                        role.name}
                    </h3>

                    <div
                      style={{
                        marginTop:
                          "5px",
                        color:
                          "#64748b",
                        fontSize:
                          "12px",
                      }}
                    >
                      {role.name}
                    </div>
                  </div>

                  <span
                    style={{
                      padding:
                        "4px 8px",
                      borderRadius:
                        "999px",
                      background:
                        role.isActive
                          ? "#dcfce7"
                          : "#f1f5f9",
                      color:
                        role.isActive
                          ? "#15803d"
                          : "#64748b",
                      fontSize:
                        "11px",
                      fontWeight:
                        600,
                    }}
                  >
                    {role.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                {/* System Role */}

                {role.isSystemRole && (
                  <div
                    style={{
                      display:
                        "inline-block",
                      marginTop:
                        "12px",
                      padding:
                        "4px 8px",
                      borderRadius:
                        "6px",
                      background:
                        "#eff6ff",
                      color:
                        "#1d4ed8",
                      fontSize:
                        "11px",
                      fontWeight:
                        600,
                    }}
                  >
                    SYSTEM ROLE
                  </div>
                )}

                {/* Description */}

                <p
                  style={{
                    margin:
                      "14px 0",
                    color:
                      "#64748b",
                    fontSize:
                      "13px",
                    lineHeight:
                      1.6,
                    minHeight:
                      "42px",
                  }}
                >
                  {role.description ||
                    "No description"}
                </p>

                {/* Permission Count */}

                <div
                  style={{
                    padding:
                      "10px 12px",
                    borderRadius:
                      "8px",
                    background:
                      "#f8fafc",
                    color:
                      "#475569",
                    fontSize:
                      "13px",
                    marginBottom:
                      "14px",
                  }}
                >
                  <strong>
                    {
                      role.permissions
                        .length
                    }
                  </strong>{" "}
                  permissions
                </div>

                {/* Actions */}

                <div
                  style={{
                    display:
                      "flex",
                    gap: "8px",
                    flexWrap:
                      "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      openEditModal(
                        role
                      )
                    }
                    disabled={
                      role.isSystemRole
                    }
                    style={{
                      flex: 1,
                      border:
                        "1px solid #cbd5e1",
                      borderRadius:
                        "8px",
                      padding:
                        "9px 12px",
                      background:
                        "#fff",
                      color:
                        "#334155",
                      cursor:
                        role.isSystemRole
                          ? "not-allowed"
                          : "pointer",
                      fontWeight:
                        600,
                      fontSize:
                        "13px",
                    }}
                  >
                    Edit
                  </button>

                  {role.isActive ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleDeactivate(
                          role
                        )
                      }
                      disabled={
                        role.isSystemRole
                      }
                      style={{
                        flex: 1,
                        border:
                          "1px solid #fecaca",
                        borderRadius:
                          "8px",
                        padding:
                          "9px 12px",
                        background:
                          "#fff",
                        color:
                          "#dc2626",
                        cursor:
                          role.isSystemRole
                            ? "not-allowed"
                            : "pointer",
                        fontWeight:
                          600,
                        fontSize:
                          "13px",
                      }}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleReactivate(
                          role
                        )
                      }
                      style={{
                        flex: 1,
                        border:
                          "1px solid #bbf7d0",
                        borderRadius:
                          "8px",
                        padding:
                          "9px 12px",
                        background:
                          "#fff",
                        color:
                          "#15803d",
                        cursor:
                          "pointer",
                        fontWeight:
                          600,
                        fontSize:
                          "13px",
                      }}
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ==================================================
          Create / Edit Modal
          ================================================== */}

      {showModal && (
        <div
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
          style={{
            position:
              "fixed",
            inset: 0,
            background:
              "rgba(15, 23, 42, 0.55)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding:
              "20px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width:
                "100%",
              maxWidth:
                "900px",
              maxHeight:
                "92vh",
              overflowY:
                "auto",
              background:
                "#fff",
              borderRadius:
                "14px",
              boxShadow:
                "0 25px 50px rgba(0,0,0,0.2)",
            }}
          >
            {/* Modal Header */}

            <div
              style={{
                position:
                  "sticky",
                top: 0,
                zIndex: 2,
                background:
                  "#fff",
                borderBottom:
                  "1px solid #e2e8f0",
                padding:
                  "20px 24px",
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
              }}
            >
              <div>
                <h2
                  style={{
                    margin:
                      0,
                    fontSize:
                      "21px",
                    color:
                      "#0f172a",
                  }}
                >
                  {editingRole
                    ? "Edit Role"
                    : "Create Role"}
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    fontSize:
                      "13px",
                    color:
                      "#64748b",
                  }}
                >
                  Configure role
                  permissions.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                style={{
                  width:
                    "34px",
                  height:
                    "34px",
                  border:
                    "none",
                  borderRadius:
                    "8px",
                  background:
                    "#f1f5f9",
                  color:
                    "#475569",
                  cursor:
                    "pointer",
                  fontSize:
                    "18px",
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div
                style={{
                  padding:
                    "24px",
                }}
              >
                {/* Form Fields */}

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(240px, 1fr))",
                    gap:
                      "16px",
                    marginBottom:
                      "20px",
                  }}
                >
                  {/* Role Name */}

                  <div>
                    <label
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "7px",
                        color:
                          "#334155",
                        fontSize:
                          "13px",
                        fontWeight:
                          600,
                      }}
                    >
                      Role Name *
                    </label>

                    <input
                      name="name"
                      value={
                        form.name
                      }
                      onChange={
                        handleInputChange
                      }
                      disabled={
                        Boolean(
                          editingRole
                        )
                      }
                      placeholder="manager"
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        border:
                          "1px solid #cbd5e1",
                        borderRadius:
                          "8px",
                        padding:
                          "10px 12px",
                        outline:
                          "none",
                        fontSize:
                          "14px",
                        background:
                          editingRole
                            ? "#f8fafc"
                            : "#fff",
                      }}
                    />

                    {editingRole && (
                      <small
                        style={{
                          display:
                            "block",
                          marginTop:
                            "5px",
                          color:
                            "#94a3b8",
                        }}
                      >
                        Role name cannot
                        be changed after
                        creation.
                      </small>
                    )}
                  </div>

                  {/* Display Name */}

                  <div>
                    <label
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "7px",
                        color:
                          "#334155",
                        fontSize:
                          "13px",
                        fontWeight:
                          600,
                      }}
                    >
                      Display Name *
                    </label>

                    <input
                      name="displayName"
                      value={
                        form.displayName
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="Shop Manager"
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        border:
                          "1px solid #cbd5e1",
                        borderRadius:
                          "8px",
                        padding:
                          "10px 12px",
                        outline:
                          "none",
                        fontSize:
                          "14px",
                      }}
                    />
                  </div>
                </div>

                {/* Description */}

                <div
                  style={{
                    marginBottom:
                      "24px",
                  }}
                >
                  <label
                    style={{
                      display:
                        "block",
                      marginBottom:
                        "7px",
                      color:
                        "#334155",
                      fontSize:
                        "13px",
                      fontWeight:
                        600,
                    }}
                  >
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleInputChange
                    }
                    rows={3}
                    placeholder="Describe what this role is intended for..."
                    style={{
                      width:
                        "100%",
                      boxSizing:
                        "border-box",
                      resize:
                        "vertical",
                      border:
                        "1px solid #cbd5e1",
                      borderRadius:
                        "8px",
                      padding:
                        "10px 12px",
                      outline:
                        "none",
                      fontSize:
                        "14px",
                      fontFamily:
                        "inherit",
                    }}
                  />
                </div>

                {/* Permission Header */}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap:
                      "12px",
                    flexWrap:
                      "wrap",
                    marginBottom:
                      "16px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin:
                          0,
                        fontSize:
                          "17px",
                        color:
                          "#0f172a",
                      }}
                    >
                      Permissions
                    </h3>

                    <p
                      style={{
                        margin:
                          "5px 0 0",
                        color:
                          "#64748b",
                        fontSize:
                          "13px",
                      }}
                    >
                      {
                        permissionCount
                      }{" "}
                      permission
                      {permissionCount !==
                      1
                        ? "s"
                        : ""}{" "}
                      selected
                    </p>
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      gap:
                        "8px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={
                        selectAllPermissions
                      }
                      style={{
                        border:
                          "1px solid #cbd5e1",
                        borderRadius:
                          "7px",
                        padding:
                          "7px 10px",
                        background:
                          "#fff",
                        color:
                          "#334155",
                        cursor:
                          "pointer",
                        fontSize:
                          "12px",
                        fontWeight:
                          600,
                      }}
                    >
                      Select All
                    </button>

                    <button
                      type="button"
                      onClick={
                        clearAllPermissions
                      }
                      style={{
                        border:
                          "1px solid #cbd5e1",
                        borderRadius:
                          "7px",
                        padding:
                          "7px 10px",
                        background:
                          "#fff",
                        color:
                          "#64748b",
                        cursor:
                          "pointer",
                        fontSize:
                          "12px",
                        fontWeight:
                          600,
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Permission Groups */}

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(280px, 1fr))",
                    gap:
                      "14px",
                  }}
                >
                  {PERMISSION_GROUPS.map(
                    (group) => {
                      const groupKeys =
                        getGroupPermissionKeys(
                          group
                        );

                      if (
                        groupKeys.length ===
                        0
                      ) {
                        return null;
                      }

                      const allSelected =
                        isGroupFullySelected(
                          group
                        );

                      const partialSelected =
                        isGroupPartiallySelected(
                          group
                        );

                      return (
                        <div
                          key={
                            group.key
                          }
                          style={{
                            border:
                              "1px solid #e2e8f0",
                            borderRadius:
                              "10px",
                            overflow:
                              "hidden",
                          }}
                        >
                          {/* Group Header */}

                          <div
                            style={{
                              padding:
                                "11px 13px",
                              background:
                                "#f8fafc",
                              borderBottom:
                                "1px solid #e2e8f0",
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "center",
                            }}
                          >
                            <strong
                              style={{
                                color:
                                  "#334155",
                                fontSize:
                                  "13px",
                              }}
                            >
                              {
                                group.label
                              }
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                toggleGroup(
                                  group
                                )
                              }
                              style={{
                                border:
                                  "none",
                                background:
                                  "transparent",
                                color:
                                  allSelected
                                    ? "#dc2626"
                                    : "#0f766e",
                                cursor:
                                  "pointer",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  600,
                              }}
                            >
                              {allSelected
                                ? "Clear"
                                : partialSelected
                                ? "Select Rest"
                                : "Select All"}
                            </button>
                          </div>

                          {/* Permissions */}

                          <div
                            style={{
                              padding:
                                "8px 12px",
                            }}
                          >
                            {group.permissions.map(
                              (
                                permission
                              ) => {
                                const enabled =
                                  availablePermissions.includes(
                                    permission.key
                                  );

                                if (
                                  !enabled
                                ) {
                                  return null;
                                }

                                const checked =
                                  form.permissions.includes(
                                    permission.key
                                  );

                                return (
                                  <label
                                    key={
                                      permission.key
                                    }
                                    style={{
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      gap:
                                        "9px",
                                      padding:
                                        "8px 2px",
                                      cursor:
                                        "pointer",
                                      fontSize:
                                        "13px",
                                      color:
                                        "#475569",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        checked
                                      }
                                      onChange={() =>
                                        togglePermission(
                                          permission.key
                                        )
                                      }
                                      style={{
                                        width:
                                          "16px",
                                        height:
                                          "16px",
                                        cursor:
                                          "pointer",
                                        accentColor:
                                          "#0f766e",
                                      }}
                                    />

                                    <span>
                                      {
                                        permission.label
                                      }
                                    </span>
                                  </label>
                                );
                              }
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Modal Error */}

                {error && (
                  <div
                    style={{
                      marginTop:
                        "18px",
                      padding:
                        "11px 13px",
                      borderRadius:
                        "8px",
                      background:
                        "#fef2f2",
                      border:
                        "1px solid #fecaca",
                      color:
                        "#b91c1c",
                      fontSize:
                        "13px",
                    }}
                  >
                    {error}
                  </div>
                )}
              </div>

              {/* Modal Footer */}

              <div
                style={{
                  position:
                    "sticky",
                  bottom: 0,
                  background:
                    "#fff",
                  borderTop:
                    "1px solid #e2e8f0",
                  padding:
                    "16px 24px",
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap:
                    "10px",
                }}
              >
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  style={{
                    border:
                      "1px solid #cbd5e1",
                    borderRadius:
                      "8px",
                    padding:
                      "10px 16px",
                    background:
                      "#fff",
                    color:
                      "#475569",
                    cursor:
                      saving
                        ? "not-allowed"
                        : "pointer",
                    fontWeight:
                      600,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  style={{
                    border:
                      "none",
                    borderRadius:
                      "8px",
                    padding:
                      "10px 18px",
                    background:
                      saving
                        ? "#94a3b8"
                        : "#0f766e",
                    color:
                      "#fff",
                    cursor:
                      saving
                        ? "not-allowed"
                        : "pointer",
                    fontWeight:
                      600,
                  }}
                >
                  {saving
                    ? "Saving..."
                    : editingRole
                    ? "Update Role"
                    : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleManagement;