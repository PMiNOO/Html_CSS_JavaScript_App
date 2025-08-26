// 전역 변수
const API_BASE_URL = "http://localhost:8088"; // 포트 번호를 application.properties에 맞게 8088로 수정

// DOM 엘리먼트 가져오기
const bookForm = document.getElementById("bookForm"); // 폼 ID를 bookForm으로 가정
const bookTableBody = document.getElementById("bookTableBody"); // 테이블 ID를 bookTableBody로 가정

// Document Load 이벤트 처리하기
document.addEventListener("DOMContentLoaded", function () {
    loadBooks();
});

// bookForm의 Submit 이벤트 처리하기
bookForm.addEventListener("submit", function (event) {
    // 기본으로 설정된 Event가 동작하지 않도록 하기 위함
    event.preventDefault();
    console.log("Form이 제출 되었음....");

    // FormData 객체 생성 <form> 엘리먼트를 객체로 변환
    const bookFormData = new FormData(bookForm);

    // 사용자 정의 Book Object Literal 객체 생성 (공백 제거 trim())
    const bookData = {
        title: bookFormData.get("title").trim(),
        author: bookFormData.get("author").trim(),
        isbn: bookFormData.get("isbn").trim(),
        price: parseInt(bookFormData.get("price")), // 숫자로 변환
        publishDate: bookFormData.get("publishDate"),
        detailRequest: {
            description: bookFormData.get("description").trim(),
            language: bookFormData.get("language").trim(),
            pageCount: parseInt(bookFormData.get("pageCount")), // 숫자로 변환
            publisher: bookFormData.get("publisher").trim(),
            coverImageUrl: bookFormData.get("coverImageUrl").trim(),
            edition: bookFormData.get("edition").trim(),
        }
    };

    // 유효성 체크하는 함수 호출하기
    if (!validateBook(bookData)) {
        // 검증 체크 실패하면 리턴하기
        return;
    }

    // 유효한 데이터 출력하기
    console.log(bookData);

    // 책을 저장하는 함수 호출
    saveBook(bookData);
}); // submit 이벤트

// 입력 항목의 값의 유효성을 체크하는 함수
function validateBook(book) {
    if (!book.title) {
        alert("책 제목을 입력해주세요.");
        return false;
    }

    if (!book.author) {
        alert("저자 이름을 입력해주세요.");
        return false;
    }

    if (!book.isbn) {
        alert("ISBN을 입력해주세요.");
        return false;
    }

    // ISBN 형식 검사 (10자리 또는 13자리, 하이픈 포함/미포함)
    const isbnPattern = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/;
    if (!isbnPattern.test(book.isbn)) {
        alert("유효한 ISBN 형식이 아닙니다 (10자리 또는 13자리 숫자).");
        return false;
    }

    if (book.price < 0 || isNaN(book.price)) {
        alert("가격은 0 이상의 숫자여야 합니다.");
        return false;
    }

    if (!book.publishDate) {
        alert("출판일을 입력해주세요.");
        return false;
    }

    return true;
}// validateBook

// 이메일 유효성 검사 (필요 시 사용)
function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Book(책) 목록을 Load 하는 함수
function loadBooks() {
    console.log("책 목록 Load 중.....");
    fetch(`${API_BASE_URL}/api/books`) // Promise
        .then((response) => {
            if (!response.ok) {
                throw new Error("책 목록을 불러오는데 실패했습니다!.");
            }
            return response.json();
        })
        .then((books) => renderBookTable(books))
        .catch((error) => {
            console.log("Error: " + error);
            alert("책 목록을 불러오는데 실패했습니다!.");
        });
}

// 책 목록을 테이블에 렌더링하는 함수
function renderBookTable(books) {
    console.log(books);
    bookTableBody.innerHTML = "";
    books.forEach((book) => {
        // <tr> 엘리먼트를 생성하기
        const row = document.createElement("tr");

        // <tr>의 content를 동적으로 생성
        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>${book.price ?? "-"}</td>
            <td>${book.publishDate ?? "-"}</td>
            <td>
                <button class="edit-btn" onclick="editBook(${book.id})">수정</button>
                <button class="delete-btn" onclick="deleteBook(${book.id})">삭제</button>
            </td>
        `;
        // <tbody> 아래에 <tr>을 추가
        bookTableBody.appendChild(row);
    });
}// renderBookTable
