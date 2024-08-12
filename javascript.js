const taskList = document.getElementById('taskList');
const popupContainer = document.getElementById('popupContainer');
let userTasksMap = new Map(); // Map to store tasks for each user
let globalTaskIdCounter = 1; // Counter for generating global task IDs
/*
- Go to jebaited.net website
- Authorize the application to connect to your Streamelements
- Go to API tokens
- Where it says "Scopes", click on it and select botMsg an click on "Add Token"
- Your token will appear right below
*/
const jebaitedToken = '{{jebaitedToken}}';

// Function to add task
function addTask(username, taskName, displayColor, badges) {
  if (!userTasksMap.has(username)) {
    userTasksMap.set(username, { tasks: [], localIdCounter: 1, completedCount: 0 });

    // Create user section
    const userSection = document.createElement('div');
    userSection.id = `user-${username}`;
    userSection.classList.add('userSection');

    // Create a container for badges and username
    const userTitleContainer = document.createElement('div');
    userTitleContainer.classList.add('userTitleContainer');

    // Create badge images
    badges.forEach(badge => {
      const badgeImg = document.createElement('img');
      badgeImg.src = badge.url;
      badgeImg.alt = badge.description;
      badgeImg.classList.add('badge');
      userTitleContainer.appendChild(badgeImg);
    });

    const userTitle = document.createElement('h3');
    userTitle.id = `userTitle-${username}`;
    userTitle.textContent = `${username} (0/0)`;
    userTitle.classList.add('userTitle');
    userTitle.style.color = displayColor; // Set the color based on data.displayColor

    userTitleContainer.appendChild(userTitle);
    userSection.appendChild(userTitleContainer);
    taskList.appendChild(userSection);
  }

  const userTaskData = userTasksMap.get(username);
  const localId = userTaskData.localIdCounter++;
  const task = { globalId: globalTaskIdCounter++, localId: localId, name: taskName, done: false };

  userTaskData.tasks.push(task);

  const taskItem = document.createElement('div');
  taskItem.classList.add('taskItem');
  taskItem.id = `task-${username}-${localId}`; // Add unique ID for the task item

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.setAttribute('data-global-id', task.globalId); // Set data-global-id attribute

  const taskText = document.createElement('span');
  taskText.textContent = `${task.localId}. ${task.name}`;

  taskItem.appendChild(checkbox);
  taskItem.appendChild(taskText);

  // Append the task to the user's section
  const userSection = document.getElementById(`user-${username}`);
  userSection.appendChild(taskItem);

  // Update task count
  updateTaskCount(username);

  // Scroll to bottom
  taskList.scrollTop = taskList.scrollHeight;

  // Send confirmation message
  return "Task " + task.name + " added for " + username + ".";
}

// Function to update task count
function updateTaskCount(username) {
  const userTaskData = userTasksMap.get(username);
  const totalCount = userTaskData.tasks.length;
  const completedCount = userTaskData.tasks.filter(task => task.done).length;
  userTaskData.completedCount = completedCount; // Ensure completedCount is updated correctly
  const userTitle = document.getElementById(`userTitle-${username}`);
  userTitle.textContent = `${username} (${completedCount}/${totalCount})`;
}

// Function to list tasks
function listTasks(username) {
  if (!userTasksMap.has(username) || userTasksMap.get(username).tasks.length === 0) {
    return `${username} has no tasks. Please use !task [task] to add a task`;
  }

  const tasks = userTasksMap.get(username).tasks.map(task => `${task.localId}. ${task.name}`);
  return `${username}'s tasks: ${tasks.join(', ')}`;
}

// Function to mark task as done
function markTaskAsDone(username, localId) {
  if (!userTasksMap.has(username)) {
    return `${username} has no tasks.`;
  }

  const tasks = userTasksMap.get(username).tasks;

  if (!localId) {
    const undoneTasks = tasks.filter(task => !task.done);
    if (undoneTasks.length === 0) {
      return `${username} has no uncompleted tasks.`;
    } else if (undoneTasks.length === 1) {
      const task = undoneTasks[0];
      task.done = true;

      // Update checkbox status
      const checkbox = document.querySelector(`[data-global-id="${task.globalId}"]`);
      if (checkbox) {
        checkbox.checked = true;
      }
      
      // Change task background color to different color
      const taskItem = document.getElementById(`task-${username}-${task.localId}`);
      if (taskItem) {
        taskItem.classList.add('completedTask');
      }
      
      // Show popup
      showPopup(`${task.name} marked as done for ${username}.`);

      // Update task count
      updateTaskCount(username);

      // Check if user completed 5 tasks
      checkCompletedTasks(username);

      return `${task.name} marked as done for ${username}.`;
    } else {
      return listTasks(username) + ' there are multiple uncompleted tasks, please choose which task using !done [number]';
    }
  }

  const task = tasks.find(task => task.localId === localId);

  if (!task) {
    return `Task with ID ${localId} not found for ${username}.`;
  }

  task.done = true;

  // Update checkbox status
  const checkbox = document.querySelector(`[data-global-id="${task.globalId}"]`);
  if (checkbox) {
    checkbox.checked = true;
  }
  
  // Change task background color to different color
  const taskItem = document.getElementById(`task-${username}-${localId}`);
  if (taskItem) {
    taskItem.classList.add('completedTask');
  }

  // Show popup
  showPopup(`${task.name} marked as done for ${username}.`);

  // Update task count
  updateTaskCount(username);

  // Check if user completed 5 tasks
  checkCompletedTasks(username);

  return `${task.name} marked as done for ${username}.`;
}

// Function to check if a user has completed 5 tasks
function checkCompletedTasks(username) {
  const userTaskData = userTasksMap.get(username);
  if (userTaskData.completedCount % 5 === 0) {
    showPopup2(`Congratulations ${username}! You have completed ${userTaskData.completedCount} tasks!`,'{{aceBanner}}');
    playAudio('{{soundFile}}','{{soundVolume}}');
  }
}

function playAudio(sound, volume) {
  let audio = new Audio(sound);	
  audio.volume = volume * .01;
  audio.play();
}

// Function to delete task
function deleteTask(username, localId) {
  if (!userTasksMap.has(username)) {
    return `${username} has no tasks.`;
  }

  const userTaskData = userTasksMap.get(username);
  const taskIndex = userTaskData.tasks.findIndex(task => task.localId === localId);

  if (taskIndex === -1) {
    return `Task with ID ${localId} not found for ${username}.`;
  }

  const task = userTaskData.tasks[taskIndex];
  userTaskData.tasks.splice(taskIndex, 1); // Remove the task from the array

  // Remove the task item from the DOM
  const taskItem = document.getElementById(`task-${username}-${localId}`);
  if (taskItem) {
    taskItem.remove();
  }

  // Update task count
  updateTaskCount(username);

  // Remove user section if no tasks left
  if (userTaskData.tasks.length === 0) {
    removeUserSection(username);
  }

  return `${task.name} deleted for ${username}.`;
}

// Function to clear all tasks for a user
function clearTasks(username, isMod) {
  if (!userTasksMap.has(username)) {
    return `${username} has no tasks to clear.`;
  }

  if (!isMod) {
    return "Only Mods can Clear Tasks";
  }

  const userTaskData = userTasksMap.get(username);
  userTaskData.tasks = []; // Clear all tasks

  // Remove all task items from the DOM
  const userSection = document.getElementById(`user-${username}`);
  while (userSection && userSection.firstChild && userSection.firstChild !== userSection.lastChild) {
    userSection.removeChild(userSection.lastChild);
  }

  // Remove user section if no tasks left
  if (userTaskData.tasks.length === 0) {
    removeUserSection(username);
  }

  return `All tasks cleared for ${username}.`;
}

// Function to remove user section
function removeUserSection(username) {
  const userSection = document.getElementById(`user-${username}`);
  if (userSection) {
    userSection.remove();
  }
  userTasksMap.delete(username);
}

// Function to show popup
function showPopup(message) {
  const popup = document.createElement('div');
  popup.classList.add('popup');
  popup.textContent = message;
  popupContainer.appendChild(popup);
  popupContainer.style.display = 'block';

  setTimeout(() => {
    popup.remove();
    if (popupContainer.children.length === 0) {
      popupContainer.style.display = 'none';
    }
  }, 3000);
}

// Function to show the second popup with an image
function showPopup2(message, imageUrl) {
  const popupContainer2 = document.getElementById('popupContainer2');
  const popup2 = document.createElement('div');
  popup2.classList.add('popup2');

  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = 'Ace Kill Banner';
  popup2.appendChild(img);

  const popupText = document.createElement('div');
  popupText.classList.add('popupText');
  popupText.textContent = message;
  popup2.appendChild(popupText);

  popupContainer2.appendChild(popup2);
  popupContainer2.style.display = 'block';

  setTimeout(() => {
    popup2.remove();
    if (popupContainer2.children.length === 0) {
      popupContainer2.style.display = 'none';
    }
  }, 3000);
}
// Smooth scrolling function
function smoothScroll(element, target, duration) {
  const start = element.scrollTop;
  const change = target - start;
  const startTime = performance.now();

  function animateScroll(currentTime) {
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    element.scrollTop = start + change * progress;

    if (timeElapsed < duration) {
      requestAnimationFrame(animateScroll);
    } else {
      // Pause for 2 seconds before reversing direction
      setTimeout(() => {
        if (target === element.scrollHeight - element.clientHeight) {
          smoothScroll(element, 0, duration);
        } else {
          smoothScroll(element, element.scrollHeight - element.clientHeight, duration);
        }
      }, 2000);
    }
  }

  requestAnimationFrame(animateScroll);
}

// Start smooth scrolling
smoothScroll(taskList, taskList.scrollHeight - taskList.clientHeight, 5000);

function getTopTaskers() {
  const sortedUsers = [...userTasksMap.entries()].sort((a, b) => b[1].completedCount - a[1].completedCount);
  const topTaskers = sortedUsers.slice(0, 5).map(([username, data]) => `${username}: ${data.completedCount} tasks`);
  return `Top Taskers:\n${topTaskers.join('\n')}`;
}

function showTopTaskersPopup(message) {
  const popup = document.getElementById('topTaskersPopup');
  popup.textContent = message;
  popup.style.display = 'block';

  setTimeout(() => {
    popup.style.display = 'none';
    popup.textContent = ''; // Clear the content
  }, 5000);
}

window.addEventListener('onEventReceived', function (obj) {
  if (obj.detail.listener == "message") {
    let data = obj.detail.event.data;
    let message = data["text"];
    const messageParts = message.split(' ');

    if (messageParts[0].charAt(0) != '!') {
      return;
    }

    const username = data.displayName;
    const displayColor = data.displayColor;
    const badges = data.badges;
    const isMod = data.tags.mod === '1' || data.tags.badges.includes("broadcaster/1");

    if (messageParts[0] === '!taskCommands') {
      const response = "Commands: !task [task name] to add a task, !done to complete a task, !delete [number] to remove a task, !tasks to list tasks";
      const encodedMessage = encodeURIComponent(response);
      fetch(`https://api.jebaited.net/botMsg/{jebaitedToken}/${encodedMessage}`);
    } else if (messageParts[0] === '!task' && messageParts.length >= 2) {
      const task = messageParts.slice(1).join(' ');
      const response = addTask(username, task, displayColor, badges);
      const encodedMessage = encodeURIComponent(response);
      fetch(`https://api.jebaited.net/botMsg/{jebaitedToken}/${encodedMessage}`);

    } else if ((messageParts[0] === '!task' || messageParts[0] === '!tasks') && messageParts.length === 1) {
      const response = listTasks(username);
      const encodedMessage = encodeURIComponent(response);
      fetch(`https://api.jebaited.net/botMsg/{jebaitedToken}/${encodedMessage}`);

    } else if (messageParts[0] === '!done') {
      const localId = parseInt(messageParts[1]);
      const response = markTaskAsDone(username, isNaN(localId) ? null : localId);
      const encodedMessage = encodeURIComponent(response);
      fetch(`https://api.jebaited.net/botMsg/{jebaitedToken}/${encodedMessage}`);

    } else if (messageParts[0] === '!delete') {
      const localId = parseInt(messageParts[1]);
      const response = deleteTask(username, localId);
      const encodedMessage = encodeURIComponent(response);
      fetch(`https://api.jebaited.net/botMsg/{jebaitedToken}/${encodedMessage}`);

    } else if (messageParts[0] === '!clear' && messageParts.length === 2 && isMod) {
      // Handle @username
      const targetUsername = messageParts[1].startsWith('@') ? messageParts[1].substring(1) : messageParts[1];
      const usernameToClear = targetUsername;
      const response = clearTasks(usernameToClear, isMod);
      const encodedMessage = encodeURIComponent(response);
      fetch(`https://api.jebaited.net/botMsg/{jebaitedToken}/${encodedMessage}`);

    } else if (messageParts[0] === '!toptaskers') {
      const response = getTopTaskers();
      showPopup(response);
      return;
    }    
  }
});