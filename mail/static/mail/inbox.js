document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', submit_mail);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // API emails
  fetch('/emails/' + mailbox)
    .then(response => response.json())
    .then(emails => {
      console.log(emails);
      let emails_view = document.querySelector("#emails-view");

      // For each email in emails => create div
      emails.forEach(email => {
        let div = document.createElement('button');

        // Classname change if mail is read or unread
        div.className = email['read'] ? "email-list read" : "email-list unread";
        div.innerHTML = email['read'] ? '<div class="icon"><img src="https://img.icons8.com/external-kiranshastry-lineal-color-kiranshastry/50/000000/external-email-interface-kiranshastry-lineal-color-kiranshastry-2.png"/></div>' : '<div class="icon"><img src="https://img.icons8.com/external-kiranshastry-lineal-color-kiranshastry/50/000000/external-email-cyber-security-kiranshastry-lineal-color-kiranshastry-3.png"/></div>';

        // Create content for each mail
        div.innerHTML += `
          <div class="sender col-3"> From : <strong>${email.sender}</strong> </div>
          <div class="subject col-5"> Subject : <strong> ${email.subject}</strong> </div>
          <div class="timestamp col-3"> ${email.timestamp} </div>
        `;

        // Add function to click on each mail
        div.addEventListener('click', () => display_mail(email.id, mailbox));

        // Add div "div" in div "emails_view"
        emails_view.appendChild(div);
      });
    })
}

function submit_mail(event) {
  // Change beheavor if needed
  event.preventDefault();

  // Create variables and save data form for send to db
  const recipients = document.querySelector('#compose-recipients').value;
  const subject  = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send data to db server
  fetch('/emails', {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => { 
    console.log(result);
    load_mailbox('sent');
  })
}

function display_mail(id, mailbox) {
  
  // Select div 'emails_view' and reset value
  let emails_view = document.querySelector('#emails-view');
  emails_view.innerHTML = '';
  
  // API mails
  fetch('/emails/' + id)
  .then(response => response.json())
  .then(email => {
    // Inster data in data div
    let data = document.createElement("div");
    data.className = "ml-3"
    data.innerHTML = `
    <div class="m-2"><strong>From:</strong> ${email.sender}</div>
    <div class="m-2"><strong>To:</strong> ${email.recipients}</div>
    <div class="m-2"><strong>Subject:</strong> ${email.subject}</div>
    <div class="m-2"><strong>Date:</strong> ${email.timestamp}</div>
    `;

    // init variable for create button
    let replyButton = document.createElement("btn");
    let archiveButton = document.createElement("btn");
    let unreadButton = document.createElement("btn");

    // give class for button
    replyButton.className = 'btn btn btn-primary m-3 ml-4';
    archiveButton.className = 'btn btn btn-outline-primary m-3';
    unreadButton.className = 'btn btn btn-outline-primary m-3';

    // content text in button reply and unRead
    replyButton.innerHTML = 'Reply';
    unreadButton.innerHTML = 'Mark as unread';
    
    // Condition for button archive
    if (email.archived)
      archiveButton.innerHTML = 'unarchive';
    else
      archiveButton.innerHTML = 'Archive';

    // Listen event for archive button
    archiveButton.addEventListener('click', () => {
      if (archiveButton.innerHTML === 'Archive')
        archiveButton.innerHTML = 'Unarchive';
      else
        archiveButton.innerHTML = 'Archive';

      // Send result to data server
      fetch('/emails/' + id, {
        method: 'PUT',
        body: JSON.stringify({
          archived: !email.archived
        })
      })
      .then(response => load_mailbox('inbox'));
    });

    // Function for unread button
    unreadButton.addEventListener('click', () => {
      fetch('/emails/' + id, {
        method: 'PUT',
        body: JSON.stringify({ read : false })
      })
      .then(response => load_mailbox('inbox'))
    })
    

    // When email is open, read is true in db 
    fetch('/emails/' + id, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })

    // Check if email subject begin with Re:
    let subject = email.subject;
    if (subject.split(" ", 1)[0] != "Re:") {
      subject = "Re: " + subject;
    }

    // Function for reply Button
    replyButton.addEventListener('click', () => {
      compose_email();
      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = email.subject;
      document.querySelector('#compose-body').value = `\n\n\n----------------------------------------------------------------\nOn ${email.timestamp} \nFrom: ${email.sender}\nTo: ${email.recipients}\n\nWrote: \n${email.body}`;

    });

    // Add data in div "emails_view"
    emails_view.appendChild(data);

    // Check if email is sended by owner user to disable reply button
    emails_view.appendChild(replyButton);
    
    if (mailbox !== 'sent') {
      emails_view.appendChild(archiveButton);
      emails_view.appendChild(unreadButton);
    }

    // Create new div for insert body
    document.createElement("hr");
    let body = document.createElement("div");
    body.className = "m-2";
    body.innerHTML = `<textarea style="width:100%; height:auto; border-radius:10px; padding:20px" readonly="true">${email.body}</textarea>`;
    console.log(body);
    emails_view.append(body);
  });
}
