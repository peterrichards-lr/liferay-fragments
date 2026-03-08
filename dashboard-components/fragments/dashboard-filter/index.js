const initDashboardFilter = () => {
  const ADMIN_API_BASE = "/o/object-admin/v1.0";

  const isValidIdentifier = (val) => {
    if (val === undefined || val === null) return false;
    const s = String(val).trim().toLowerCase();
    return (
      s !== "" &&
      s !== "undefined" &&
      s !== "null" &&
      s !== "0" &&
      s !== "[object object]"
    );
  };

  if (layoutMode === "view") {
    Date.prototype.addDays = function (days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    };

    if (configuration) {
      const defaultMaxEntires = configuration.maxEntries
        ? configuration.maxEntries
        : 7;
      const defaultStartDate = configuration.startDate
        ? new Date(configuration.startDate)
        : new Date();
      const defaultEndDate = configuration.endDate
        ? new Date(configuration.endDate)
        : defaultStartDate.addDays(defaultMaxEntires);
      const defaultStepsTarget = configuration.stepsTarget
        ? configuration.stepsTarget
        : 10000;
      const defaultPubSubTopic = configuration.pubsubTopic
        ? configuration.pubsubTopic
        : "healthcare-example";

      const startDateEl = fragmentElement.querySelector(
        `#${fragmentNamespace}_startDate`,
      );
      if (startDateEl) {
        startDateEl.valueAsDate = defaultStartDate;
      }
      const endDateEl = fragmentElement.querySelector(
        `#${fragmentNamespace}_endDate`,
      );
      if (endDateEl) {
        endDateEl.valueAsDate = defaultEndDate;
      }

      const maxEntriesEl = fragmentElement.querySelector(
        `#${fragmentNamespace}_maxEntries`,
      );
      if (maxEntriesEl) {
        maxEntriesEl.value = defaultMaxEntires;
      }

      const targetStepsEl = fragmentElement.querySelector(
        `#${fragmentNamespace}_targetSteps`,
      );
      if (targetStepsEl) {
        targetStepsEl.value = defaultStepsTarget;
      }

      const refreshDashboard = (e) => {
        if (e) e.preventDefault();

        // Broadcast signal for synchronized fragments (Gemini recipe support)
        Liferay.fire("refreshData");

        const dashboard = document.querySelector("#healthcare-dashboard");

        var charts;
        if (dashboard) {
          charts = dashboard.querySelectorAll("healthcare-component");
        } else {
          console.warn("Unable to find dashboard, search full DOM");
          charts = document.querySelectorAll("healthcare-component");
        }

        if (charts) {
          charts.forEach((chart) => {
            if (startDateEl) {
              const val = startDateEl.value;
              chart.setAttribute("startdate", val);
            }

            if (endDateEl) {
              const val = endDateEl.value;
              chart.setAttribute("enddate", val);
            }

            if (maxEntriesEl) {
              const val = maxEntriesEl.value;
              chart.setAttribute("maxentries", val);
            }

            if (targetStepsEl) {
              const val = targetStepsEl.value;
              chart.setAttribute("targetsteps", val);
            }
          });
        } else {
          console.warn("Unable to find the healthcare components");
        }
      };

      const refreshDashboardBtn = fragmentElement.querySelector(
        `#${fragmentNamespace}_refreshDashboard`,
      );
      if (refreshDashboardBtn && refreshDashboard) {
        refreshDashboardBtn.addEventListener("click", refreshDashboard);
      }

      // Add keyboard support: Refresh on Enter in any input
      const inputs = fragmentElement.querySelectorAll("input");
      inputs.forEach((input) => {
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            refreshDashboard(e);
          }
        });
      });

      const randomIntFromInterval = (min, max) => {
        return Math.floor(randomFloatFromInterval(min, max));
      };

      const randomFloatFromInterval = (min, max) => {
        return Math.random() * (max - min + 1) + min;
      };

      const getAsync = async (path) => {
        if (!isValidIdentifier(path)) return {};
        const response = await Liferay.Util.fetch(path);
        if (response.ok) {
          return await response.json();
        }
        return {};
      };

      const submitData = (path, data) => {
        if (!isValidIdentifier(path)) return Promise.reject("Invalid path");
        return Liferay.Util.fetch(path, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Success:", data);
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      };

      let apiPaths = {};

      const resolveObjectPath = async (key, defaultPath) => {
        const configPath = configuration[key] || defaultPath;
        const objectName = configPath.replace(/^\/o\/c\//, "");

        try {
          const response = await Liferay.Util.fetch(
            `${ADMIN_API_BASE}/object-definitions/by-rest-context-path/${objectName}`,
          );
          if (!response.ok)
            throw new Error("Failed to fetch object definition");

          const definition = await response.json();
          let path = definition.restContextPath;

          if (definition.scope === "site") {
            const siteId = Liferay.ThemeDisplay.getScopeGroupId();
            path += `/scopes/${siteId}`;
          }

          apiPaths[key] = path;
        } catch (err) {
          console.error(
            `[Dashboard Filter] Scope resolution failed for ${key}:`,
            err,
          );
          apiPaths[key] = `/o/c/${objectName}`;
        }
      };

      const resolveAllPaths = async () => {
        await Promise.all([
          resolveObjectPath("heartRateAPIPath", "heartrates"),
          resolveObjectPath("bloodPressureAPIPath", "bloodpressures"),
          resolveObjectPath("stepsAPIPath", "stepses"),
          resolveObjectPath("weightAPIPath", "weights"),
        ]);
      };

      const getLastHeartRate = async (userId) => {
        if (!apiPaths.heartRateAPIPath)
          await resolveObjectPath("heartRateAPIPath", "heartrates");
        const lastReading = await getAsync(
          `${apiPaths.heartRateAPIPath}?filter=r_heartRate_userId%20eq%20%27${userId}%27&page=1&pageSize=1&sort=readingDate%3Adesc`,
        );
        if (lastReading && lastReading.items && lastReading.items.length > 0) {
          const { lowest, highest } = lastReading.items[0];
          return { lowest, highest };
        }
        return { lowest: 0, highest: 0 };
      };

      const generateHeartRateData = (
        userId,
        readingDate,
        previousHeartRate,
      ) => {
        const lowest = randomIntFromInterval(
          previousHeartRate.lowest * 0.95,
          previousHeartRate.lowest * 1.05,
        );
        const highest = randomIntFromInterval(
          previousHeartRate.highest * 0.95,
          previousHeartRate.highest * 1.05,
        );
        return {
          readingDate,
          lowest,
          highest,
          r_heartRate_userId: userId,
        };
      };

      const getLastBloodPressure = async (userId) => {
        if (!apiPaths.bloodPressureAPIPath)
          await resolveObjectPath("bloodPressureAPIPath", "bloodpressures");
        const lastReading = await getAsync(
          `${apiPaths.bloodPressureAPIPath}?filter=r_bloodPressure_userId%20eq%20%27${userId}%27&page=1&pageSize=1&sort=readingDate%3Adesc`,
        );
        if (lastReading && lastReading.items && lastReading.items.length > 0) {
          const { diastolic, systolic } = lastReading.items[0];
          return { diastolic, systolic };
        }
        return { diastolic: 0, systolic: 0 };
      };

      const generateBloodPressureData = (
        userId,
        readingDate,
        previousBloodPressure,
      ) => {
        const diastolic = randomIntFromInterval(
          previousBloodPressure.diastolic * 0.9,
          previousBloodPressure.diastolic * 1.1,
        );
        const systolic = randomIntFromInterval(
          previousBloodPressure.systolic * 0.9,
          previousBloodPressure.systolic * 1.1,
        );
        return {
          readingDate,
          diastolic,
          systolic,
          r_bloodPressure_userId: userId,
        };
      };

      const getLastStepsCount = async (userId) => {
        if (!apiPaths.stepsAPIPath)
          await resolveObjectPath("stepsAPIPath", "stepses");
        const lastReading = await getAsync(
          `${apiPaths.stepsAPIPath}?filter=r_steps_userId%20eq%20%27${userId}%27&page=1&pageSize=1&sort=readingDate%3Adesc`,
        );
        if (lastReading && lastReading.items && lastReading.items.length > 0) {
          const { stepCount } = lastReading.items[0];
          return stepCount;
        }
        return 0;
      };

      const generateStepsData = (userId, readingDate, previousStepCount) => {
        const stepCount = randomIntFromInterval(
          previousStepCount * 0.6,
          previousStepCount * 1.4,
        );
        return {
          readingDate,
          stepCount,
          r_steps_userId: userId,
        };
      };

      const getLastWeight = async (userId) => {
        if (!apiPaths.weightAPIPath)
          await resolveObjectPath("weightAPIPath", "weights");
        const lastReading = await getAsync(
          `${apiPaths.weightAPIPath}?filter=r_weight_userId%20eq%20%27${userId}%27&page=1&pageSize=1&sort=readingDate%3Adesc`,
        );
        if (lastReading && lastReading.items && lastReading.items.length > 0) {
          const { weight } = lastReading.items[0];
          return weight;
        }
        return 0;
      };

      const generateWeightData = (userId, readingDate, previousWeight) => {
        const weight = randomFloatFromInterval(
          previousWeight * 0.97,
          previousWeight * 1.03,
        );
        return {
          readingDate,
          weight: Math.round((weight + Number.EPSILON) * 10) / 10,
          r_weight_userId: userId,
        };
      };

      const syncData = async (e) => {
        const userId = Liferay.ThemeDisplay.getUserId();

        if (!isValidIdentifier(userId)) {
          console.error("Invalid User ID for sync data.");
          return;
        }

        await resolveAllPaths();

        const startDate = new Date(startDateEl.value);
        const endDate = new Date(endDateEl.value);
        var heartRateData = [];
        var bloodPressureData = [];
        var stepsData = [];
        var weightData = [];

        var lastHeartRate = await getLastHeartRate(userId);
        var lastBloodPressure = await getLastBloodPressure(userId);
        var lastStepsCount = await getLastStepsCount(userId);
        var lastWeight = await getLastWeight(userId);

        for (
          var curDate = startDate;
          curDate <= endDate;
          curDate.setDate(curDate.getDate() + 1)
        ) {
          const heartRate = generateHeartRateData(
            userId,
            new Date(curDate.valueOf()),
            lastHeartRate,
          );
          heartRateData.push(heartRate);
          const { lowest, highest } = heartRate;
          lastHeartRate = { lowest, highest };
          const bloodPressure = generateBloodPressureData(
            userId,
            new Date(curDate.valueOf()),
            lastBloodPressure,
          );
          bloodPressureData.push(bloodPressure);
          const { diastolic, systolic } = bloodPressure;
          lastBloodPressure = { diastolic, systolic };
          const steps = generateStepsData(
            userId,
            new Date(curDate.valueOf()),
            lastStepsCount,
          );
          stepsData.push(steps);
          lastStepsCount = steps.stepCount;
          const weight = generateWeightData(
            userId,
            new Date(curDate.valueOf()),
            lastWeight,
          );
          weightData.push(weight);
          lastWeight = weight.weight;
        }

        if (heartRateData.length > 0) {
          submitData(`${apiPaths.heartRateAPIPath}/batch`, heartRateData).then(
            () => {
              submitData(
                `${apiPaths.bloodPressureAPIPath}/batch`,
                bloodPressureData,
              ).then(() => {
                submitData(`${apiPaths.stepsAPIPath}/batch`, stepsData).then(
                  () => {
                    submitData(
                      `${apiPaths.weightAPIPath}/batch`,
                      weightData,
                    ).then(() => {
                      if (!PubSub) {
                        console.warn("PubSub is not available");
                      } else if (!defaultPubSubTopic) {
                        console.warn("The PubSub topic has not been set");
                      } else {
                        const msg = {
                          refresh: true,
                        };
                        var token = PubSub.publish(defaultPubSubTopic, msg);
                        console.log("PubSub token", token);
                      }
                    });
                  },
                );
              });
            },
          );
        }
      };

      const syncDataBtn = fragmentElement.querySelector(
        `#${fragmentNamespace}_syncData`,
      );
      if (syncDataBtn && syncData) {
        syncDataBtn.addEventListener("click", syncData);
      }

      // Pre-resolve paths
      resolveAllPaths();
    }
  }
};

initDashboardFilter();
