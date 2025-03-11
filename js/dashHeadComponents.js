function updateUserTime() {
  const now = new Date();
  document.getElementById("userTime").textContent = now.toLocaleString(
    undefined,
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }
  );
}
setInterval(updateUserTime, 1000);
updateUserTime();

document.addEventListener("DOMContentLoaded", () => {
  if (navigator.geolocation) {
    const locationTimeout = setTimeout(() => {
      handleWeatherError(
        "Location access timed out. Please check your permissions."
      );
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(locationTimeout);
        const { latitude, longitude } = position.coords;

        if (!latitude || !longitude) {
          handleWeatherError("Invalid geolocation data.");
          return;
        }

        try {
          let response = await fetch(
            `/.netlify/functions/weather?latitude=${latitude}&longitude=${longitude}`
          );

          if (!response.ok) {
            console.warn("Primary weather API failed, trying fallback...");
            document.getElementById("weatherInfo").textContent =
              "Trying alternative source...";

            response = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=YOUR_FALLBACK_API_KEY`
            );
          }

          if (!response.ok) {
            const errorData = await response.text();
            console.error("Weather API error:", errorData);
            document.getElementById("weatherInfo").textContent =
              "Error fetching weather data.";
            return;
          }

          const data = await response.json();

          document.getElementById(
            "weatherInfo"
          ).textContent = `${data.name}: ${data.main.temp}°C, ${data.weather[0].description}`;
          document.getElementById("weatherDetails").innerHTML = `
                        <strong>Temperature:</strong> ${data.main.temp}°C <br>
                        <strong>Humidity:</strong> ${data.main.humidity}% <br>
                        <strong>Wind Speed:</strong> ${data.wind.speed} m/s <br>
                        <strong>Pressure:</strong> ${
                          data.main.pressure
                        } hPa <br>
                        <strong>Sunrise:</strong> ${new Date(
                          data.sys.sunrise * 1000
                        ).toLocaleTimeString(undefined, { hour12: true })} <br>
                        <strong>Sunset:</strong> ${new Date(
                          data.sys.sunset * 1000
                        ).toLocaleTimeString(undefined, { hour12: true })}
                    `;
        } catch (error) {
          handleWeatherError("Error fetching weather data: " + error.message);
        }
      },
      (error) => {
        clearTimeout(locationTimeout);
        handleWeatherError("Geolocation error: " + error.message);
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 30000, 
      }
    );
  } else {
    handleWeatherError("Geolocation is not supported by this browser.");
  }

  function handleWeatherError(message) {
    console.error(message);
    document.getElementById("weatherInfo").innerHTML = `
      <span class="text-yellow-400"><i class="fas fa-exclamation-triangle mr-2"></i>Weather unavailable</span>
    `;
    document.getElementById("weatherDetails").innerHTML = `
      <p>Sorry, we couldn't load weather data. Please:</p>
      <ul class="list-disc pl-5 mt-2">
        <li>Check your location permissions</li>
        <li>Ensure you're connected to the internet</li>
        <li>Try refreshing the page</li>
      </ul>
    `;
  }

  document.getElementById("jokeButton").addEventListener("click", function () {
    fetch("https://v2.jokeapi.dev/joke/Dark?type=single")
      .then((response) => response.json())
      .then((data) => {
        const joke = data.joke || "No joke available right now.";
        document.getElementById("modalJoke").textContent = joke;
        document.getElementById("jokeModal").classList.remove("hidden");
      })
      .catch((error) => {
        console.error("Error fetching joke:", error);
      });
  });

  document.getElementById("jokeModal").addEventListener("click", function (e) {
    if (e.target === this) {
      document.getElementById("jokeModal").classList.add("hidden");
    }
  });

  document.getElementById("laughButton").addEventListener("click", function () {
    document.getElementById("jokeModal").classList.add("hidden");
    triggerEmojiRain("😂");
  });

  document.getElementById("sadButton").addEventListener("click", function () {
    document.getElementById("jokeModal").classList.add("hidden");
    triggerEmojiRain("😢");
  });

  // Back to Top Button functionality
  const backToTopBtn = document.getElementById("backToTopBtn");
  const mainContent = document.querySelector("main");

  // Show button when scrolling down, hide when at top
  mainContent.addEventListener("scroll", function () {
    if (mainContent.scrollTop > 300) {
      backToTopBtn.classList.remove("opacity-0", "invisible");
      backToTopBtn.classList.add("opacity-100", "visible");
    } else {
      backToTopBtn.classList.remove("opacity-100", "visible");
      backToTopBtn.classList.add("opacity-0", "invisible");
    }
  });

  // Scroll to top when button is clicked
  backToTopBtn.addEventListener("click", function () {
    mainContent.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
});

function triggerEmojiRain(emoji) {
  const emojiCount = 50;
  for (let i = 0; i < emojiCount; i++) {
    let emojiElement = document.createElement("span");
    emojiElement.textContent = emoji;
    emojiElement.style.position = "absolute";
    emojiElement.style.top = `${Math.random() * 100}%`;
    emojiElement.style.left = `${Math.random() * 100}%`;
    emojiElement.style.fontSize = `${Math.random() * 30 + 20}px`;
    emojiElement.style.opacity = "1";
    emojiElement.style.animation = "falling 1s ease-in-out forwards";
    document.getElementById("emojiRain").appendChild(emojiElement);

    setTimeout(() => {
      emojiElement.remove();
    }, 5000);
  }
}

const style = document.createElement("style");
style.innerHTML = `
@keyframes falling {
    0% {
        transform: translateY(0);
        opacity: 1;
    }
    100% {
        transform: translateY(100vh);
        opacity: 0;
    }
}
`;
document.head.appendChild(style);
