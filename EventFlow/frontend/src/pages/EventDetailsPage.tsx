import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  cancelEvent,
  completeEvent,
  confirmEvent,
  getEventById,
} from "../services/events";
import { listActivities } from "../services/activities";
import { listEventTypes } from "../services/eventTypes";
import { listActiveStudents, listStudents } from "../services/students";
import {
  listParticipantsForEvent,
  addStudentParticipant,
  removeStudentParticipant,
} from "../services/eventParticipants";
import { listStaff } from "../services/staff";
import {
  addStaffParticipant,
  listStaffParticipantsForEvent,
  removeStaffParticipant,
} from "../services/eventStaffParticipants";
import { listVehicles } from "../services/vehicles";
import {
  assignDriver,
  listEventDrivers,
  removeDriver,
  updateDriver,
} from "../services/eventDrivers";
import type {
  EventDriverRecord,
  EventRecord,
  EventStaffParticipantRecord,
  StaffRecord,
  VehicleRecord,
} from "../types/models";
import { useAuth } from "../context/AuthContext";
import VehicleTripPlanning from "../components/VehicleTripPlanning";

function formatDate(value: Date) {
  return value.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [activitiesMap, setActivitiesMap] = useState<Record<string, string>>(
    {},
  );
  const [eventTypesMap, setEventTypesMap] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [activeStudents, setActiveStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<StaffRecord[]>([]);
  const [staffParticipants, setStaffParticipants] = useState<
    EventStaffParticipantRecord[]
  >([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [drivers, setDrivers] = useState<EventDriverRecord[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const peopleWithDietaryRestrictions = [
    ...participants.map((participant) => {
      const person = allStudents.find(
        (student) => student.studentId === participant.studentId,
      );
      return person &&
        Array.isArray(person.dietaryRestrictions) &&
        person.dietaryRestrictions.some((item: string) => item.trim())
        ? {
            id: `student-${person.studentId}`,
            name: person.displayName,
            restrictions: person.dietaryRestrictions,
          }
        : null;
    }),
    ...staffParticipants.map((participant) => {
      const person = allStaff.find(
        (staff) => staff.staffId === participant.staffId,
      );
      return person &&
        Array.isArray(person.dietaryRestrictions) &&
        person.dietaryRestrictions.some((item) => item.trim())
        ? {
            id: `staff-${person.staffId}`,
            name: person.displayName,
            restrictions: person.dietaryRestrictions,
          }
        : null;
    }),
  ].filter(
    (person): person is { id: string; name: string; restrictions: string[] } =>
      person !== null,
  );
  const { firebaseUser } = useAuth();

  useEffect(() => {
    async function loadEvent() {
      if (!eventId) {
        setError("Missing event ID.");
        setLoading(false);
        return;
      }

      try {
        const [
          loaded,
          activities,
          eventTypes,
          students,
          parts,
          staffRecords,
          staffParts,
          vehicleRecords,
          driverRecords,
        ] = await Promise.all([
          getEventById(eventId),
          listActivities(),
          listEventTypes(),
          listStudents(),
          listParticipantsForEvent(eventId),
          listStaff(),
          listStaffParticipantsForEvent(eventId),
          listVehicles(),
          listEventDrivers(eventId),
        ]);

        if (!loaded) {
          setError("Event not found.");
          return;
        }

        setEvent(loaded);
        setActivitiesMap(
          Object.fromEntries(activities.map((a) => [a.activityId, a.name])),
        );
        setEventTypesMap(
          Object.fromEntries(eventTypes.map((t) => [t.eventTypeId, t.name])),
        );
        // students contains all students. activeStudents for selector should be filtered.
        setAllStudents(students);
        setActiveStudents(students.filter((s: any) => s.active));
        setParticipants(parts.filter((p) => p.status === "active"));
        setAllStaff(staffRecords);
        setStaffParticipants(staffParts.filter((p) => p.status === "active"));
        setVehicles(vehicleRecords);
        setDrivers(
          driverRecords.filter((driver) => driver.status === "assigned"),
        );
      } catch {
        setError("Unable to load event details.");
      } finally {
        setLoading(false);
      }
    }

    void loadEvent();
  }, [eventId]);

  const refreshParticipantSummary = async () => {
    if (!eventId) return;
    const [studentParts, staffParts, refreshedEvent, refreshedDrivers] = await Promise.all([
      listParticipantsForEvent(eventId),
      listStaffParticipantsForEvent(eventId),
      getEventById(eventId),
      listEventDrivers(eventId),
    ]);
    setParticipants(studentParts.filter((item) => item.status === "active"));
    setStaffParticipants(staffParts.filter((item) => item.status === "active"));
    setEvent(refreshedEvent);
    setDrivers(refreshedDrivers.filter((item) => item.status === "assigned"));
  };

  const handleAction = async (action: "confirm" | "complete" | "cancel") => {
    if (!eventId || !event) return;
    if (action === "confirm") {
      if (!firebaseUser) {
        setError("An approved signed-in user is required to confirm an event.");
        return;
      }
      if (
        !window.confirm(
          "Confirm this event? Its status will move from Draft to Confirmed.",
        )
      ) {
        return;
      }
    }
    setSaving(true);
    setError(null);

    try {
      if (action === "confirm") {
        await confirmEvent(eventId, firebaseUser!.uid);
      } else if (action === "complete") {
        await completeEvent(eventId);
      } else {
        await cancelEvent(eventId);
      }
      const refreshed = await getEventById(eventId);
      setEvent(refreshed);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "";
      const isExpectedConfirmationError =
        action === "confirm" &&
        (message === "Event does not exist." ||
          message === "Only a draft event can be confirmed." ||
          message.endsWith("is required before confirmation.") ||
          message === "Return must occur after departure before confirmation.");
      setError(
        isExpectedConfirmationError
          ? message
          : `Unable to ${action} the event. Please try again.`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Event details</h1>
          <p className="mt-2 text-sm text-slate-600">
            Review the selected event and manage its status.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-slate-900"
          >
            Back to list
          </button>
          {event && (
            <Link
              to={`/events/${event.eventId}/edit`}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Edit event
            </Link>
          )}
        </div>
      </div>

      {error && event ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          Loading event details…
        </div>
      ) : !event ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          {error ?? "Event not found."}
        </div>
      ) : event ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{event.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{event.location}</p>
              </div>
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                {event.status}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium">Activity</div>
                <div>{activitiesMap[event.activityId] ?? event.activityId}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium">Event type</div>
                <div>
                  {eventTypesMap[event.eventTypeId] ?? event.eventTypeId}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium">Departure</div>
                <div>{formatDate(event.departureDateTime)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium">Return</div>
                <div>{formatDate(event.returnDateTime)}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xl font-semibold">
                  {event.studentParticipantCount}
                </div>
                <div className="text-xs text-slate-600">Students</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xl font-semibold">
                  {event.staffParticipantCount}
                </div>
                <div className="text-xs text-slate-600">Staff</div>
              </div>
              <div className="rounded-2xl bg-slate-900 p-3 text-white">
                <div className="text-xl font-semibold">
                  {event.participantCount}
                </div>
                <div className="text-xs text-slate-200">Total</div>
              </div>
            </div>
            {event.hasDietaryRestrictions ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                Dietary restrictions
              </div>
            ) : null}
          </div>
          <VehicleTripPlanning eventId={event.eventId} vehicles={vehicles} staff={allStaff} onParticipantsChanged={refreshParticipantSummary} />
          {false && (<>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Student participants</h3>
            <p className="mt-2 text-sm text-slate-600">
              Add or remove students for this event.
            </p>

            <div className="mt-4 space-y-4">
              <div className="flex gap-2">
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none"
                >
                  <option value="">Select student to add</option>
                  {activeStudents
                    .filter(
                      (s) =>
                        !participants.find((p) => p.studentId === s.studentId),
                    )
                    .map((s) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.displayName} · Grade {s.grade}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedStudentId || saving}
                  onClick={async () => {
                    if (!selectedStudentId || !event) return;
                    setSaving(true);
                    setError(null);
                    try {
                      await addStudentParticipant(
                        event.eventId,
                        selectedStudentId,
                        firebaseUser?.uid || "",
                      );
                      const parts = await listParticipantsForEvent(
                        event.eventId,
                      );
                      setParticipants(
                        parts.filter((p) => p.status === "active"),
                      );
                      const refreshed = await getEventById(event.eventId);
                      setEvent(refreshed);
                      setSelectedStudentId("");
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Failed to add participant.",
                      );
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {participants.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    No active student participants.
                  </p>
                ) : (
                  participants.map((p) => {
                    const student = allStudents.find(
                      (s) => s.studentId === p.studentId,
                    );
                    return (
                      <div
                        key={p.eventParticipantId}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 p-3"
                      >
                        <div className="text-sm text-slate-700">
                          {(student && student.displayName) || p.studentId}
                        </div>
                        <div>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={async () => {
                              if (!event) return;
                              setSaving(true);
                              setError(null);
                              try {
                                await removeStudentParticipant(
                                  event.eventId,
                                  p.studentId,
                                  firebaseUser?.uid || "",
                                );
                                const parts = await listParticipantsForEvent(
                                  event.eventId,
                                );
                                setParticipants(
                                  parts.filter((pp) => pp.status === "active"),
                                );
                                const refreshed = await getEventById(
                                  event.eventId,
                                );
                                setEvent(refreshed);
                              } catch (err) {
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to remove participant.",
                                );
                              } finally {
                                setSaving(false);
                              }
                            }}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Staff participants</h3>
            <p className="mt-2 text-sm text-slate-600">
              Staff participation is separate from driver eligibility and future
              driver assignments.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                disabled={saving}
                className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm disabled:opacity-50"
              >
                <option value="">Select active staff to add</option>
                {allStaff
                  .filter(
                    (record) =>
                      record.active &&
                      !staffParticipants.some(
                        (participant) => participant.staffId === record.staffId,
                      ),
                  )
                  .map((record) => (
                    <option key={record.staffId} value={record.staffId}>
                      {record.displayName} · {record.roleTitle}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                disabled={!selectedStaffId || saving}
                onClick={async () => {
                  if (!event || !selectedStaffId || !firebaseUser) return;
                  setSaving(true);
                  setError(null);
                  try {
                    await addStaffParticipant(
                      event.eventId,
                      selectedStaffId,
                      firebaseUser.uid,
                    );
                    const [parts, refreshed] = await Promise.all([
                      listStaffParticipantsForEvent(event.eventId),
                      getEventById(event.eventId),
                    ]);
                    setStaffParticipants(
                      parts.filter((part) => part.status === "active"),
                    );
                    setEvent(refreshed);
                    setSelectedStaffId("");
                  } catch (reason) {
                    const known = reason instanceof Error &&
                      ([
                        "Staff member is already an active participant for this event.",
                        "Inactive staff cannot be added to an event.",
                      ].includes(reason.message) || reason.message.startsWith("This person is already participating in "));
                    setError(
                      known
                        ? (reason as Error).message
                        : "Unable to add the staff participant. Please try again.",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Add staff"}
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {staffParticipants.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No active staff participants.
                </p>
              ) : (
                staffParticipants.map((participant) => {
                  const record = allStaff.find(
                    (item) => item.staffId === participant.staffId,
                  );
                  const isActiveDriver = drivers.some(
                    (driver) => driver.staffId === participant.staffId,
                  );
                  return (
                    <div
                      key={participant.eventStaffParticipantId}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {record?.displayName ?? participant.staffId}
                        </p>
                        <p className="text-xs text-slate-500">
                          {record?.roleTitle || "Staff"}
                          {record && !record.active
                            ? " · Inactive staff record"
                            : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={async () => {
                          if (!event || !firebaseUser) return;
                          if (
                            isActiveDriver &&
                            !window.confirm(
                              "This staff participant is also assigned as a driver. Removing them will also remove their driver assignment, assigned vehicle, and driver role. Continue?",
                            )
                          ) {
                            return;
                          }
                          setSaving(true);
                          setError(null);
                          try {
                            await removeStaffParticipant(
                              event.eventId,
                              participant.staffId,
                              firebaseUser.uid,
                            );
                            const [parts, refreshed, refreshedDrivers] = await Promise.all([
                              listStaffParticipantsForEvent(event.eventId),
                              getEventById(event.eventId),
                              listEventDrivers(event.eventId),
                            ]);
                            setStaffParticipants(
                              parts.filter((part) => part.status === "active"),
                            );
                            setEvent(refreshed);
                            setDrivers(
                              refreshedDrivers.filter(
                                (item) => item.status === "assigned",
                              ),
                            );
                          } catch (reason) {
                            setError(
                              reason instanceof Error
                                ? `Unable to remove the staff participant: ${reason.message}`
                                : "Unable to remove the staff participant. Please try again.",
                            );
                          } finally {
                            setSaving(false);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50 sm:w-auto"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          </>)}

          {event.hasDietaryRestrictions &&
          peopleWithDietaryRestrictions.length > 0 ? (
            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-amber-950">
                Dietary restrictions
              </h3>
              <div className="mt-4 space-y-3">
                {peopleWithDietaryRestrictions.map((person) => (
                  <div key={person.id} className="rounded-2xl bg-white p-4">
                    <p className="font-semibold text-slate-900">
                      {person.name}
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      {person.restrictions.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {false && (
          <section className="hidden">
            <h3 className="text-lg font-semibold">Drivers and Vehicles</h3>
            <p className="mt-2 text-sm text-slate-600">
              Assigning a driver also adds them as a staff participant when needed.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                disabled={saving}
                className="rounded-2xl border px-3 py-3 text-sm"
              >
                <option value="">Select eligible driver</option>
                {allStaff
                  .filter(
                    (item) =>
                      item.active &&
                      item.canDrive &&
                      !drivers.some(
                        (driver) => driver.staffId === item.staffId,
                      ),
                  )
                  .map((item) => (
                    <option key={item.staffId} value={item.staffId}>
                      {item.displayName}
                    </option>
                  ))}
              </select>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                disabled={saving}
                className="rounded-2xl border px-3 py-3 text-sm"
              >
                <option value="">No vehicle</option>
                {vehicles
                  .filter(
                    (item) =>
                      item.active &&
                      !drivers.some(
                        (driver) => driver.vehicleId === item.vehicleId,
                      ),
                  )
                  .map((item) => (
                    <option key={item.vehicleId} value={item.vehicleId}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </div>
            <button
              type="button"
              disabled={saving || !selectedDriverId}
              onClick={async () => {
                if (!event || !firebaseUser) return;
                setSaving(true);
                setError(null);
                try {
                  await assignDriver(
                    event.eventId,
                    selectedDriverId,
                    selectedVehicleId || null,
                    firebaseUser.uid,
                  );
                  const [refreshedDrivers, refreshedStaff, refreshedEvent] =
                    await Promise.all([
                      listEventDrivers(event.eventId),
                      listStaffParticipantsForEvent(event.eventId),
                      getEventById(event.eventId),
                    ]);
                  setDrivers(
                    refreshedDrivers.filter(
                      (item) => item.status === "assigned",
                    ),
                  );
                  setStaffParticipants(
                    refreshedStaff.filter((item) => item.status === "active"),
                  );
                  setEvent(refreshedEvent);
                  setSelectedDriverId("");
                  setSelectedVehicleId("");
                } catch (reason) {
                  const known = reason instanceof Error &&
                    ([
                      "That vehicle is already assigned to another driver for this event.",
                      "That vehicle is assigned to another event during this time.",
                      "Staff member is already assigned as a driver.",
                      "Staff member is not eligible to drive.",
                      "Vehicle is inactive or unavailable.",
                    ].includes(reason.message) || reason.message.startsWith("This person is already participating in "));
                  setError(
                    known
                      ? (reason as Error).message
                      : "Unable to assign driver.",
                  );
                } finally {
                  setSaving(false);
                }
              }}
              className="mt-3 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Assign driver
            </button>
            <div className="mt-5 space-y-3">
              {drivers.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No active drivers assigned.
                </p>
              ) : (
                drivers.map((driver) => {
                  const person = allStaff.find(
                    (item) => item.staffId === driver.staffId,
                  );
                  const vehicle = vehicles.find(
                    (item) => item.vehicleId === driver.vehicleId,
                  );
                  return (
                    <article
                      key={driver.eventDriverId}
                      className="rounded-2xl border p-4"
                    >
                      <p className="font-semibold">
                        {person?.displayName ?? driver.staffId}
                      </p>
                      <p className="text-sm text-slate-600">
                        {vehicle?.name ?? "No vehicle assigned"}
                        {vehicle && !vehicle.active
                          ? " · Inactive vehicle"
                          : ""}
                      </p>
                      <div className="mt-3">
                        <select
                          value={driver.vehicleId ?? ""}
                          disabled={saving}
                          onChange={async (e) => {
                            setSaving(true);
                            setError(null);
                            try {
                              await updateDriver(
                                event!.eventId,
                                driver.staffId,
                                e.target.value || null,
                              );
                              setDrivers(
                                (await listEventDrivers(event!.eventId)).filter(
                                  (item) => item.status === "assigned",
                                ),
                              );
                            } catch (reason) {
                              setError(
                                reason instanceof Error &&
                                  reason.message.startsWith("That vehicle")
                                  ? reason.message
                                  : "Unable to update driver.",
                              );
                            } finally {
                              setSaving(false);
                            }
                          }}
                          className="rounded-xl border px-3 py-2 text-sm"
                        >
                          <option value="">No vehicle</option>
                          {vehicles
                            .filter(
                              (item) =>
                                item.active ||
                                item.vehicleId === driver.vehicleId,
                            )
                            .filter(
                              (item) =>
                                !drivers.some(
                                  (other) =>
                                    other.staffId !== driver.staffId &&
                                    other.vehicleId === item.vehicleId,
                                ),
                            )
                            .map((item) => (
                              <option
                                key={item.vehicleId}
                                value={item.vehicleId}
                              >
                                {item.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={async () => {
                          if (!firebaseUser) return;
                          setSaving(true);
                          try {
                            await removeDriver(
                              event!.eventId,
                              driver.staffId,
                              firebaseUser.uid,
                            );
                            setDrivers(
                              (await listEventDrivers(event!.eventId)).filter(
                                (item) => item.status === "assigned",
                              ),
                            );
                          } catch {
                            setError("Unable to remove driver.");
                          } finally {
                            setSaving(false);
                          }
                        }}
                        className="mt-3 rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700"
                      >
                        Remove driver
                      </button>
                    </article>
                  );
                })
              )}
            </div>
          </section>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Operational details</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div>
                  <span className="font-medium">Purpose:</span>{" "}
                  {event.purpose || "Not specified"}
                </div>
                <div>
                  <span className="font-medium">Meals missed:</span>{" "}
                  {event.mealsMissed.length
                    ? event.mealsMissed.join(", ")
                    : "None"}
                </div>
                <div>
                  <span className="font-medium">Equipment needed:</span>{" "}
                  {event.equipmentNeeded.join(", ") || "None"}
                </div>
                <div>
                  <span className="font-medium">Notes:</span>{" "}
                  {event.notes || "None"}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Event management</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div>
                  <span className="font-medium">Created by:</span>{" "}
                  {event.createdByUserName}
                </div>
                <div>
                  <span className="font-medium">Created at:</span>{" "}
                  {formatDate(event.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Last updated:</span>{" "}
                  {formatDate(event.updatedAt)}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {event.status === "draft" ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleAction("confirm")}
                    className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Confirm Event
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={
                    saving ||
                    event.status === "cancelled" ||
                    event.status === "completed"
                  }
                  onClick={() => void handleAction("cancel")}
                  className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel event
                </button>
                <button
                  type="button"
                  disabled={
                    saving ||
                    event.status === "completed" ||
                    event.status === "cancelled"
                  }
                  onClick={() => void handleAction("complete")}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Mark completed
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
