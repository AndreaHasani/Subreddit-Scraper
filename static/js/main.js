//// Smooth scroll
//function ScrollToResolver(elem) {
//  var jump = parseInt(elem.getBoundingClientRect().top * 0.2);
//  document.body.scrollTop += jump;
//  document.documentElement.scrollTop += jump;
//  //lastjump detects anchor unreachable, also manual scrolling to cancel animation if scroll > jump
//  if (!elem.lastjump || elem.lastjump > Math.abs(jump)) {
//    elem.lastjump = Math.abs(jump);
//    setTimeout(function() {
//      ScrollToResolver(elem);
//    }, "25");
//  } else {
//    elem.lastjump = null;
//  }
//}
//$(".mobile-menu ul")
//  .find("a")
//  .forEach(function(e) {
//    e.addEventListener(
//      "click",
//      function(event) {
//        event.preventDefault();
//        ScrollToResolver($($(this).attr("href"))[0]);
//      },
//      false
//    );
//  });

$(window).bind("beforeunload", function() {
  var items = $("table tbody").html();
  if (items.length > 0) {
    localStorage.setItem("body", items);
  }
});

$(document).ready(function() {
  var items = localStorage.getItem("body");
  if (items) {
    $("#data-output tbody").html(items);
  }
});

// Settings Pane
$(document).ready(function() {
  $("#settings").click(function() {
    var spWidth = $(".sidepanel").width();
    var spMarginLeft = parseInt($(".sidepanel").css("margin-left"), 10);
    var w = spMarginLeft >= 0 ? spWidth * -1 : 0;
    var cw = w < 0 ? -w : spWidth - 22;
    $(".sidepanel").animate(
      {
        marginLeft: w
      },
      300,
      "swing"
    );
  });
});

// Load Modal
// $(document).ready(function() {
//   $("#settings").click(function() {
//     $("#settingsModal .content .keyword-control").remove();
//     $("#settingsModal").fadeIn(200);

//     var checkbox = $('input[name="chk[]"]:checked');
//     var subreddits = [];
//     for (var i = 0; i < checkbox.length; i++) {
//       subreddits.push(checkbox[i].value);
//     }

//     var html_base =
//       "<div class='input-group col-6'> " +
//       "<div class='input-group-prepend'> " +
//       "<span class='input-group-text' id='inputGroup-sizing-default'>$subreddit</span> " +
//       "</div> " +
//       "<input type='input' id='addKeyword' class='form-control' placeholder='keyword..'> " +
//       "<div class='input-group-append'> " +
//       "<button class='btn' id='add'>Add</button> " +
//       "</div> " +
//       "</div> " +
//       "<div class='input-group col-6'> " +
//       "<div class='input-group'> " +
//       "<select class='custom-select' id='inputGroupSelect04'> " +
//       "</select> " +
//       "<div class='input-group-append'> " +
//       "<button class='btn' type='button'>Remove</button> " +
//       "</div> " +
//       "</div>";

//     for (i = 0; i < subreddits.length; i++) {
//       var output =
//         "<div class='keyword-control d-flex row " + subreddits[i] + "'>";
//       output += html_base.replace("$subreddit", subreddits[i]);
//       output += "</div>";
//       $("#settingsModal .content").append(output);
//     }
//   });
// });

$(document).ready(function() {
  // Close Modal
  $("#settingsModal .close").click(function() {
    $("#settingsModal").fadeOut(200);
  });
});

// Dropdown Jquery

var dropdowns = $(".dropdown");

// Onclick on a dropdown, toggle visibility
dropdowns.find("dt").click(function() {
  dropdowns.find("dd ul").hide();
  $(this)
    .next()
    .children()
    .toggle();
});

// Clic handler for dropdown
dropdowns.find("dd ul li a").click(function() {
  var leSpan = $(this)
    .parents(".dropdown")
    .find("dt a span");

  // Remove selected class
  $(this)
    .parents(".dropdown")
    .find("dd a")
    .each(function() {
      $(this).removeClass("selected");
    });

  // Update selected value
  leSpan.html($(this).html());

  // If back to default, remove selected class else addclass on right element
  if ($(this).hasClass("default")) {
    leSpan.removeClass("selected");
  } else {
    leSpan.addClass("selected");
    $(this).addClass("selected");
  }

  // Close dropdown
  $(this)
    .parents("ul")
    .hide();
});

// Close all dropdown onclick on another element
$(document).bind("click", function(e) {
  if (
    !$(e.target)
      .parents()
      .hasClass("dropdown")
  )
    $(".dropdown dd ul").hide();
});

// Use a "/test" namespace.
// An application can open a connection on multiple namespaces, and
// Socket.IO will multiplex all those connections on a single
// physical channel. If you don't care about multiple channels, you
// can set the namespace to an empty string.
namespace = "/reddit";
// Connect to the Socket.IO server.
// The connection URL has the following format:
//     http[s]://<domain>:<port>[/<namespace>]
var socket = io.connect(
  location.protocol + "//" + document.domain + ":" + location.port + namespace
);
// Event handler for new connections.
// The callback function is invoked when a connection with the
// server is established.
$("#connect").click(function() {
  $("table tbody tr").remove();
  $("#connect").prop("disabled", true);
  $("#disconnect").prop("disabled", false);
  var checkbox = $('input[name="chk[]"]:checked');
  if (checkbox.length > 0) {
    var subreddits = [];
    for (var i = 0; i < checkbox.length; i++) {
      subreddits.push(checkbox[i].value);
    }

    socket.emit("background_start", { subs: subreddits });
  } else {
    alert("Check one of the boxes");
  }
});

$("#disconnect").click(function() {
  $("#connect").prop("disabled", false);
  $("#disconnect").prop("disabled", true);
  socket.emit("background_stop");
  $("table tbody tr").remove();
});

socket.on("background_response", function(msg) {
  var tableLimit = $("#limitInput").val();
  Push.create("New Job Post", {
    body: msg.title,
    icon: "icon.png",
    timeout: 8000, // Timeout before notification closes automatically.
    vibrate: [100, 100, 100], // An array of vibration pulses for mobile devices.
    onClick: function() {
      // Callback for when the notification is clicked.
      console.log(this);
    }
  });
  if ($("table tbody tr").length > tableLimit) {
    $("table tbody tr")
      .last()
      .remove();
  }

  output = "<tr>";
  output += "<td>" + msg.date + "</td>";
  output += "<td><a href='" + msg.url + "'>" + msg.title + "</a></td>";
  output += "</tr>";
  $("#data-output tbody").prepend(output);
});

window.onbeforeunload = function() {
  socket.emit("disconnect");
};

socket.on("connection_response", function(msg) {
  console.log(msg.running_process);
});

function tableSearch() {
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("searchInput");
  filter = input.value.toUpperCase();
  table = $("#data-output");
  rows = $("#data-output tbody tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < rows.length; i++) {
    td = rows[i].getElementsByTagName("td")[1];
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        rows[i].style.display = "";
      } else {
        rows[i].style.display = "none";
      }
    }
  }
}
