/*This creates a global variable with the HTML element input in it. */
var input = document.getElementById("myFile");
/*This creates a global variable with the HTML element div with id output in it. */
var output = document.getElementById("output");
/* this 2 lines are used to set the source and the destination.
The first will get where you put your file, in this case it's the input element.
The second will get the div which content will be replaced by the content of your txt file. */
let exportContent = document.getElementById("exportContent");

let parseBtn = document.getElementById('parseBtn');
//enable once bibtex is read
parseBtn.disabled = true;

let exportBtn = document.getElementById('exportBtn');
//starts disabled, gets enabled once content is parsed
exportBtn.disabled = true;

let query = document.getElementById('query');
let user = document.getElementById('user');

//bases checkboxes
{/* <input type="checkbox" id="catalogue">Каталог на НБИВ
<input type="checkbox" id="cobiss">cobiss
<input type="checkbox" id="ebsco"> ebsco
<input type="checkbox" id="leninka">Cyberleninka */}
{/* <input type="checkbox" id="scholar"> Google Scholar */ }
let catalogue = document.getElementById('catalogue');
//catalogue is checked by default
catalogue.checked = true;
let cobiss = document.getElementById('cobiss');
let ebsco = document.getElementById('ebsco');
let scholar = document.getElementById('scholar');
let leninka = document.getElementById('leninka');


/* Here we tell to our input element to do something special when his value changes.
A change will occur for example when a user will chose a file.*/
input.addEventListener("change", function () {
  /* First thing we do is checking if this.files exists and this.files[0] aswell.
  they might not exist if the change is going from a file (hello.txt) to no file at all  */
  if (this.files && this.files[0]) {
    /* Since we can chose more than one file by shift clicking multiple files, here we ensure that we only take the first one set. */
    var myFile = this.files[0];
    /* FileReader is the Object in the JavaScript standard that has the capabilities to read and get informations about files (content, size, creation date, etc) */
    var reader = new FileReader();

    /* Here we give the instruction for the FileReader we created, we tell it that when it loads, it should do some stuff. The load event is fired when the FileReader reads a file. In our case this hasn't happened yet, but as soon as it will this function will fire. */
    reader.addEventListener("load", function (e) {
      /* What we do here is take the result of the fileReader and put it inside our output div to display it to the users. This is where you could do your scrambling and maybe save the result in a variable ? */
      //   output.textContent = e.target.result;
      parseBtn.disabled = false;
      //attach event listener here?
      parseBtn.addEventListener('click', function () {
        parseBib(e.target.result);
      })

    });
    /* This is where we tell the FileReader to open and get the content of the file. This will fire the load event and get the function above to execute its code. */
    reader.readAsText(myFile);
  }


});

//parse the bibtex
function parseBib(bibcontent) {
  //create empty array
  let bibtexRecords = [];

  let recordsArray = bibcontent.split("@book");
  recordsArray.shift()
  console.log(recordsArray)

  recordsArray.forEach(record => {
    //create object
    let bibtexRecord = {}

    let elements = record.match(/[\w]* = {([\s\S]*?)}/gm);
      elements.forEach(e => {

      //split to key-value
      let meta = e.match(/[\w]* = /gm);
      let metaString = meta[0];
      metaString = metaString.substring(0, metaString.length - 3)
   
      let content = e.match(/= {(.*?)\}/gm);
      let contentString = content[0];
      contentString = contentString.substring(3, contentString.length - 1)
    
      bibtexRecord[metaString] = contentString;


    })
    //split authors IF THERE ARE ANY
    if (bibtexRecord.author) {
      let normalizedAuthors = bibtexRecord.author.replaceAll(' and ', '; ');
      bibtexRecord.author = normalizedAuthors;
    } else {
      //if there aren't authors!
      bibtexRecord.author = '';
    }

    //assign type,default is book
    bibtexRecord.type = 'book';

    bibtexRecords.push(bibtexRecord);

  });

  //sort books by main entry and then append
  let records = bibtexRecords.sort((a, b) => a.main.localeCompare(b.main))

  //enable exportBtn
  exportBtn.disabled = false;

  //create separate arrays for books and articles
  let bookRecords = [];
  let articleRecords = [];

  records.forEach(bibtexRecord => {

    let isbdString = "default";

    //define type og record

    if (bibtexRecord.hasOwnProperty('journal')) {
      bibtexRecord.type = "analytical";
      articleRecords.push(bibtexRecord);

    } else {
      bookRecords.push(bibtexRecord);
    }
  })

  //visualise articles
  let articlesDiv = document.createElement('div');
  let articlesLabel = document.createElement('p');
  articlesLabel.textContent = `Статии: ${articleRecords.length}`;
  articlesLabel.style.fontWeight='bold';
  articlesDiv.appendChild(articlesLabel);
  articleRecords.forEach(r => {
    let articleContainer = document.createElement('div');
    //main entry
    appendSortWord(articleContainer, r)
    isbdString = `${r.title}/ ${r.author}. - В: ${r.journal}. - ${r.number}, (${r.year}), с. ${r.pages}`;
    let articleP = document.createElement('p');
    articleP.textContent = isbdString;
    articleContainer.appendChild(articleP)
    articlesDiv.appendChild(articleContainer);
  })

  //visualise books
  let booksDiv = document.createElement('div');
  let booksLabel = document.createElement('p');
  booksLabel.textContent = `Книги: ${bookRecords.length}`;
  booksLabel.style.fontWeight='bold';
  booksDiv.appendChild(booksLabel);
  bookRecords.forEach(r => {
    let bookContainer = document.createElement('div');
    //signature
    if (r.hasOwnProperty('signature')) {
      //getSignature
      let signatureP = document.createElement('p');
      signatureP.textContent = r.signature;
      bookContainer.appendChild(signatureP);
    }
    //sort word
    appendSortWord(bookContainer, r)
    isbdString = `${r.title}/ ${r.author}. - ${r.address}: ${r.publisher}, ${r.year}. - ${r.pages}`;
    let bookP = document.createElement('p');
    bookP.textContent = isbdString;
    bookContainer.appendChild(bookP);
    //note
    appendNote(bookContainer, r)

    booksDiv.appendChild(bookContainer);
  })

  //clean the container
  exportContent.innerHTML = '';
  //add query
  let queryP = document.createElement('p');
  queryP.textContent = `Тема на справката: ${query.value}`;
  exportContent.appendChild(queryP);

  //add number of resources
  let resourcesP = document.createElement('p');
  resourcesP.textContent = `Брой източници: ${records.length}\n Книги:${bookRecords.length}; Статии: ${articleRecords.length}`;
  exportContent.appendChild(resourcesP);

   //add date
  let dateP = document.createElement('p');
  const date = new Date();

  // ✅ DD/MM/YYYY
  const result1 = new Date().toLocaleDateString('en-GB');
  console.log(result1); // 👉️ 24/07/2023
  dateP.textContent = `Дата: ${result1}`
  //try to keep formatting in exporting
  dateP.style.fontWeight='bold';
  exportContent.appendChild(dateP);

  //add user
  let userP = document.createElement('p');
  userP.textContent = `Изготвил: ${user.value}`;
  exportContent.appendChild(userP)

  //append content
  exportContent.appendChild(booksDiv)
  exportContent.appendChild(articlesDiv);

  //add bases
  let bases = [];
  if (catalogue.checked) {
    bases.push('Каталог');
  }
  if (cobiss.checked) {
    bases.push('COBISS')
  }
  if (ebsco.checked) {
    bases.push('EBSCO')
  }
  if (scholar.checked) {
    bases.push('Google Наука')
  }
  if (leninka.checked) {
    bases.push('Cyberleninka')
  }
  //append only if bases are checked
  if (bases.length > 0) {
    let basesLabel = document.createElement('p');
    basesLabel.textContent = 'Използвани бази:'
    basesLabel.style.fontWeight='bold';
    exportContent.appendChild(basesLabel);
    bases.forEach(b => {
      let baseP = document.createElement('p');
      baseP.textContent = b;
      exportContent.appendChild(baseP);

    })
  }
}

function appendNote(container, recordObject) {
  if (recordObject.hasOwnProperty('note')) {
    console.log('hasNote');
    let noteP = document.createElement('p');
    noteP.classList.add('smaller');
    noteP.textContent = recordObject.note;
    container.appendChild(noteP)
  }
}

function appendSortWord(container, recordObject) {
  let sortWordP = document.createElement('p');
  sortWordP.style.marginBottom='-12px'
  // mainEntryP.classList.add('mainEntry');

  sortWordP.textContent = recordObject.main;
  container.appendChild(sortWordP);
}

function Export2Word(element, filename = '') {
  var preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
  var postHtml = "</body></html>";
  var html = preHtml + document.getElementById(element).innerHTML + postHtml;

  var blob = new Blob(['\ufeff', html], {
    type: 'application/msword'
  });

  // Specify link url
  var url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);

  // Specify file name
  filename = filename ? filename + '.doc' : 'document.doc';

  // Create download link element
  var downloadLink = document.createElement("a");

  document.body.appendChild(downloadLink);

  if (navigator.msSaveOrOpenBlob) {
    navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    // Create a link to the file
    downloadLink.href = url;

    // Setting the file name
    downloadLink.download = filename;

    //triggering the function
    downloadLink.click();
  }

  document.body.removeChild(downloadLink);
}