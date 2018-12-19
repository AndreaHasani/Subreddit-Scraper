// Util, move to another js if needed to cleaner code
function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
}

// Local variables

// Json keywords, {subreddit:{title_keyword: '', keywords_include: []
// keywords_exclude: []}}
var subreddit_items;
subreddit_items = JSON.parse(localStorage.getItem("subreddit_items"));
var selected_subreddit;
if (subreddit_items == null) {
  // Adding default subreddits, get data from server side implementation needed
  subreddit_items = {
    forhire: { titleKeyword: [], includeKeyword: [], excludeKeyword: [] },
    slavelabour: { titleKeyword: [], includeKeyword: [], excludeKeyword: [] },
    web_design: { titleKeyword: [], includeKeyword: [], excludeKeyword: [] }
  };
}

// Document unload cookie save
$(window).bind("beforeunload", function() {
  var items = $("table tbody").html();
  if (items.length > 0) {
    localStorage.setItem("body", items);
    if (isEmpty(subreddit_items) != true) {
      localStorage.setItem("subreddit_items", JSON.stringify(subreddit_items));
    }
  }
});

$(document).ready(function() {
  var items = localStorage.getItem("body");
  if (items) {
    $("#data-output tbody").html(items);
  }
});

// Function Enable btn
function addEnable(input) {
  if (input.length > 1) {
    $("#add").prop("disabled", false);
  } else {
    $("#add").prop("disabled", true);
  }
}

// Document ready dynamic input
$(document).ready(function() {
  settings_open_close();
  generate_checkbox();
  generate_selector();
  onclickBtn();
  onEnter();

  var subredditSelect = $(".redditSelector select");
  selected_subreddit = subredditSelect.find("option:selected");

  subredditSelect
    .change(function() {
      $("option:selected").each(function() {
        selected_subreddit = $(this);
        keywords_UI_improvments(selected_subreddit.text());
      });
    })
    .change();

  keywords_UI_improvments(selected_subreddit.text());
});

function keywords_UI_improvments(selected) {
  $(".items-count").remove();
  var object = subreddit_items[selected];
  var element;
  var listBtn;

  for (var property in object) {
    if (object.hasOwnProperty(property)) {
      element = "<span class='items-count'>";
      element += object[property].length + " keywords";
      element += "</span>";
      $(".sidepanel .keyword input[name='" + property + "']")
        .parents()
        .eq(1)
        .append(element);

      listBtn = $(".sidepanel .keyword input[name='" + property + "']")
        .parent()
        .find(".input-group-prepend button");
      if (object[property].length > 0) {
        listBtn.prop("disabled", false);
      } else {
        listBtn.prop("disabled", true);
      }
    }
  }
}

function settings_open_close() {
  var spWidth = $(".sidepanel").width();
  var spMarginLeft;
  var w;

  // #settings(open) -> outside click
  $(document).click(function(event) {
    if (
      !$(event.target).closest(".sidepanel, #settings, button, input").length
    ) {
      $(".sidepanel").animate({ marginLeft: -spWidth }, 300, "swing");
    }
  });

  // #settings -> click
  $(document).ready(function() {
    $("#settings").click(function() {
      spMarginLeft = parseInt($(".sidepanel").css("margin-left"), 10);
      w = spMarginLeft >= 0 ? spWidth * -1 : 0;
      // var cw = w < 0 ? -w : spWidth - 22;
      $(".sidepanel").animate({ marginLeft: w }, 300, "swing");
    });
  });
}

function keyword_remove_event() {
  // keyword-sector -> keywords-span -> click
  $(".sidepanel .keywords-div span").click(function() {
    var value = $(this).text();
    $(this)
      .parents()
      .eq(2)
      .find("input")
      .val(value);
  });
}

function onEnter() {
  $(".sidepanel .keyword input").keypress(function(e) {
    if (e.which == 13) {
      var keywordDiv = $(this).parent();
      // Enter key pressed
      console.log(keywordDiv);
      keywordDiv.find(".input-group-append button").click(); // Trigger search button click event
    }
  });

  $(".table-top #addInput").keypress(function(e) {
    if (e.which == 13) {
      $(".table-top #add").click(); // Trigger search button click event
    }
  });
}

function onclickBtn() {
  // #addInput -> Click
  $("#addInput")
    .parent()
    .find(".input-group-append button")
    .click(function() {
      inputValue = $("#addInput");
      html = "<label class='form-check form-check-inline'>";
      html +=
        "<input type='checkbox' name='chk[]' value='" + inputValue.val() + "'>";
      html += inputValue.val();
      html += "</label>";
      $(".main .subreddit-control").append(html);

      subreddit_items[inputValue.val()] = {
        titleKeyword: [],
        includeKeyword: [],
        excludeKeyword: []
      };

      $(".sidepanel .redditSelector select").append(
        "<option value='" +
          inputValue.val() +
          "'>" +
          inputValue.val() +
          "</option>"
      );
    });

  // subreddit-select -> btn-remove -> click
  $(".sidepanel .redditSelector .btn").click(function() {
    $(
      ".main .subreddit-control input[value='" +
        selected_subreddit.text() +
        "']"
    )
      .parent()
      .remove();
    selected_subreddit.remove();
    delete subreddit_items[selected_subreddit.text()];
  });

  // keyword-sector -> right-btn(Add, remove) -> click
  $(".sidepanel .keyword .input-group-append .btn").click(function() {
    var value = $(this).text();
    var keywordDiv = $(this)
      .parents()
      .eq(2);
    var inputValue = keywordDiv.find("input");
    var inputGroup = inputValue.attr("name");
    var exists = subreddit_items[selected_subreddit.text()][inputGroup].indexOf(
      inputValue.val()
    );

    if (value == "Add") {
      if (exists == -1 && inputValue.val() != "") {
        var rowsEdited = 0;
        subreddit_items[selected_subreddit.text()][inputGroup].push(
          inputValue.val()
        );

        keywordDiv
          .find(".keywords-div .row")
          .append("<span class='col-4'>" + inputValue.val() + "</span>");
        keywords_UI_improvments(selected_subreddit.text());
      } else {
        alert("Keyword Exist or empty");
      }
    } else if (value == "Remove") {
      if (inputValue.val() == "(all)") {
        subreddit_items[selected_subreddit.text()][inputGroup] = [];
        keywordDiv.find(".keywords-div .row span").remove();
        keywordDiv.find(".input-group-prepend button").click();
      } else {
        var valueDeleteIndex = subreddit_items[selected_subreddit.text()][
          inputGroup
        ].indexOf(inputValue.val());
        subreddit_items[selected_subreddit.text()][inputGroup].splice(
          valueDeleteIndex,
          1
        );
        keywordDiv
          .find(".keywords-div .row span")
          .filter(function() {
            return $(this).text() === inputValue.val();
          })
          .remove();
      }
    }

    inputValue.val(""); // Clear input value
  });

  // keyword-sector -> left-btn(list, back) -> click
  $(".sidepanel .keyword .input-group-prepend .btn").click(function() {
    var value = $(this).text();
    var divInput = $(this)
      .parents()
      .eq(2)
      .find("input");

    var inputValue = divInput.val();
    divInput.val("");
    var keywordDiv = $(this)
      .parents()
      .eq(2);
    var appendBtn = $(this)
      .parents()
      .eq(2)
      .find(".input-group-append .btn");

    if (value == "List") {
      $(".items-count").hide();
      var sector = divInput.attr("name");
      keywords_populate(selected_subreddit.text(), sector);
      keyword_remove_event();

      keywordDiv.find("input").prop("readonly", true);
      $(this).text("Back");
      appendBtn.text("Remove");
      divInput.val("(all)");
      keywordDiv.find("input").css("cursor", "default");
      $(".sidepanel .keyword")
        .not(keywordDiv[0])
        .slideUp();
      keywordDiv.find(".keywords-div").slideDown();
    } else if (value == "Back") {
      keywords_UI_improvments(selected_subreddit.text());
      $(".items-count").show();
      keywordDiv.find("input").prop("readonly", false);
      $(this).text("List");
      appendBtn.text("Add");
      keywordDiv.find("input").css("cursor", "text");
      keywordDiv.find(".keywords-div").slideUp();

      $(".sidepanel .keyword")
        .not(keywordDiv[0])
        .slideDown();
      keywordDiv.find(".row").remove();
    }
  });
}

function generate_checkbox() {
  var i;
  subreddit_items_keys = Object.keys(subreddit_items);
  for (i = 0; i < subreddit_items_keys.length; i++) {
    element = "<label class='form-check form-check-inline'>";
    element +=
      "<input type='checkbox' name='chk[]' value='" +
      subreddit_items_keys[i] +
      "'>" +
      subreddit_items_keys[i];
    element += "</label>";
    $(".main .subreddit-control").append(element);
  }
}

function generate_selector() {
  var i;
  // Append Reddit Selector
  var checkbox = $('input[name="chk[]"]').each(function() {
    $(".sidepanel .redditSelector select").append(
      "<option value='" + this.value + "'>" + this.value + "</option>"
    );
  });

  // Append Keywords
}

function keywords_populate(selected, sector) {
  // Refactor this into list btn click
  var keywords = subreddit_items[selected][sector];
  if (keywords.length > 0) {
    var html = "<div class='row'>";

    for (i = 0; i < keywords.length; i++) {
      html += "<span class='col-4'>" + keywords[i] + "</span>";
    }

    html += "</div>";

    $(".sidepanel input[name=" + sector + "]")
      .parent()
      .find(".keywords-div")
      .append(html);
  }
}

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
//       "<span class='input-group-text'
//       id='inputGroup-sizing-default'>$subreddit</span> " +
//       "</div> " +
//       "<input type='input' id='addKeyword' class='form-control'
//       placeholder='keyword..'> " +
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

// Socket Connection
namespace = "/reddit";
var socket = io.connect(
  location.protocol + "//" + document.domain + ":" + location.port + namespace
);
$("#connect").click(function() {
  // Cleanup
  $("table tbody tr").remove();

  // Variables
  var checkbox = $('input[name="chk[]"]:checked');

  if (checkbox.length > 0) {
    $("#connect").prop("disabled", true);
    $("#disconnect").prop("disabled", false);
    var subreddits = [];
    for (var i = 0; i < checkbox.length; i++) {
      subreddits.push(checkbox[i].value);
    }

    socket.emit("background_start", {
      checked: subreddits,
      subreddits: subreddit_items
    });
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

  // Loop through all table rows, and hide those who don't match the search
  // query
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
