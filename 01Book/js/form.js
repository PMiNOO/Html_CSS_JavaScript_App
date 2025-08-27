// 전역 변수
const API_BASE_URL = "http://localhost:8088"; // 포트 번호를 application.properties에 맞게 8088로 수정
// 현재 수정 중인 도서 ID
// [실습 1-6] 3) 변수 선언하기
let editingBookId = null;

// DOM 엘리먼트 가져오기
const bookForm = document.getElementById("bookForm"); // 폼 ID를 bookForm으로 가정
const bookTableBody = document.getElementById("bookTableBody"); // 테이블 ID를 bookTableBody로 가정

// [실습 1-6] 3) 변수 선언하기
const submitButton = document.querySelector("button[type='submit']");
const cancelButton = document.querySelector(".cancel-btn");

const formErrorSpan = document.getElementById("formError");


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
        title: bookFormData.get("title")?.trim(),
        author: bookFormData.get("author")?.trim(),
        isbn: bookFormData.get("isbn")?.trim(),
        price: parseInt(bookFormData.get("price")) || 0,
        publishDate: bookFormData.get("publishDate"),
        detailRequest: {
            description: bookFormData.get("description")?.trim() || "",
            language: bookFormData.get("language")?.trim() || "",
            pageCount: parseInt(bookFormData.get("pageCount")) || 0,
            publisher: bookFormData.get("publisher")?.trim() || "",
            coverImageUrl: bookFormData.get("coverImageUrl")?.trim() || "",
            edition: bookFormData.get("edition")?.trim() || "",
        }
    };

    // 유효성 체크하는 함수 호출하기
    if (!validateBook(bookData)) {
        // 검증 체크 실패하면 리턴하기
        return;
    }

    // 유효한 데이터 출력하기
    console.log(bookData);

    // editingBookId 값의 존재 여부에 따라 등록 또는 수정 함수 호출
    if (editingBookId) {
        updateBook(editingBookId, bookData);
    } else {
        createBook(bookData);
    }
}); // submit 이벤트

// 취소 버튼 클릭 이벤트
cancelButton.addEventListener("click", function() {
    resetForm();
});


/**
 * [실습 1-6] 1) book을 등록하는 createBook() 함수
 * @param bookData
 */
function createBook(bookData) {
    fetch(`${API_BASE_URL}/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData) // Object => json
    })
        .then(async (response) => {
            if (!response.ok) {
                // 응답 본문을 읽어서 에러 메시지 추출
                const errorData = await response.json();
                // status code와 message를 확인하기
                if (response.status === 409) { // 409 Conflict (중복)
                    // 중복 오류 처리
                    throw new Error(errorData.message || '중복되는 정보(ISBN)가 있습니다.');
                } else {
                    // 기타 오류 처리
                    throw new Error(errorData.message || '책 등록에 실패했습니다.')
                }
            }
            return response.json();
        })
        .then((result) => {
            showSuccess("책이 성공적으로 등록되었습니다!");
            resetForm();
            loadBooks(); // 목록 새로 고침
        })
        .catch((error) => {
            console.log('Error : ', error);
            showError(error.message);
        });
}//createBook


/**
 * [실습 1-6] 2) book을 삭제하는 deleteBook(bookId) 함수
 * @param bookId
 * @param bookTitle
 */
function deleteBook(bookId, bookTitle) {
    if (!confirm(`'${bookTitle}' 책을 정말로 삭제하시겠습니까?`)) {
        return;
    }

    fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        method: 'DELETE',
    })
    .then(async (response) => { // async 추가
        // 204 No Content는 성공이지만 body가 없으므로 response.ok만 체크
        if (!response.ok) {
            // 응답 본문을 읽어서 에러 메시지 추출
            const errorData = await response.json();
            if (response.status === 404) {
                throw new Error(errorData.message || '존재하지 않는 책입니다.');
            } else {
                throw new Error(errorData.message || '책 삭제에 실패했습니다.');
            }
        }
        // 삭제 성공 시 (200 OK 또는 204 No Content)
        showSuccess('책이 성공적으로 삭제되었습니다.');
        loadBooks(); // 목록 새로고침
    })
    .catch((error) => {
        console.error('Error:', error);
        showError(error.message);
    });
}//deleteBook

/**
 * [실습 1-6] 4) book을 수정하기 전에 데이터를 로드하는 editBook(bookId) 함수 작성하기
 * @param bookId
 */
function editBook(bookId) {
    fetch(`${API_BASE_URL}/api/books/${bookId}`)
        .then(async (response) => { // async 추가
            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 404) {
                    throw new Error(errorData.message || '존재하지 않는 책입니다.');
                } else {
                    throw new Error(errorData.message || '책 정보를 불러오는데 실패했습니다.');
                }
            }
            return response.json();
        })
        .then(book => {
            // 폼에 데이터 채우기
            bookForm.title.value = book.title;
            bookForm.author.value = book.author;
            bookForm.isbn.value = book.isbn;
            bookForm.price.value = book.price;
            bookForm.publishDate.value = book.publishDate;

            /*
            // HTML에 해당 id를 가진 input이 없으므로 주석 처리합니다.
            if (book.detail) {
                bookForm.description.value = book.detail.description || '';
                bookForm.language.value = book.detail.language || '';
                bookForm.pageCount.value = book.detail.pageCount || '';
                bookForm.publisher.value = book.detail.publisher || '';
                bookForm.coverImageUrl.value = book.detail.coverImageUrl || '';
                bookForm.edition.value = book.detail.edition || '';
            }
            */

            // 수정 모드 설정
            editingBookId = bookId;
            submitButton.textContent = '도서 수정';
            cancelButton.style.display = 'inline-block';
        })
        .catch(error => {
            console.error('Error:', error);
            showError(error.message);
        });
}//editBook

/**
 * [실습 1-6] 5) book을 수정 처리하는 함수 updateBook(bookId, bookData) 함수 작성하기
 * @param bookId
 * @param bookData
 */
function updateBook(bookId, bookData) {
    fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
    })
    .then(async (response) => {
        if (!response.ok) {
            const errorData = await response.json();
            // 409 Conflict (중복) 오류 처리 추가
            if (response.status === 409) {
                throw new Error(errorData.message || '중복되는 정보(ISBN)가 있습니다.');
            } else {
                throw new Error(errorData.message || '책 수정에 실패했습니다.');
            }
        }
        return response.json();
    })
    .then(() => {
        showSuccess('책 정보가 성공적으로 수정되었습니다.');
        resetForm();
        loadBooks();
    })
    .catch(error => {
        console.error('Error:', error);
        showError(error.message);
    });
}//updateBook

// 폼을 초기 상태로 리셋하는 함수
function resetForm() {
    bookForm.reset();
    editingBookId = null;
    submitButton.textContent = '도서 등록';
    cancelButton.style.display = 'none';
    //error message 초기화
    clearMessages();
}//resetForm

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
}//validateBook

// Book(책) 목록을 Load 하는 함수
function loadBooks() {
    console.log("책 목록 Load 중.....");
    fetch(`${API_BASE_URL}/api/books`)
        .then(async (response) => {
            if (!response.ok) {
                //응답 본문을 읽어서 에러 메시지 추출
                const errorData = await response.json();
                throw new Error(`${errorData.message}`);
            }
            return response.json();
        })
        .then((books) => renderBookTable(books))
        .catch((error) => {
            console.log(error);
            showError(error.message); 
            bookTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #dc3545;">
                        오류: 데이터를 불러올 수 없습니다.
                    </td>
                </tr>
            `;
        });
}//loadBooks

// 책 목록을 테이블에 렌더링하는 함수
function renderBookTable(books) {
    console.log(books);
    bookTableBody.innerHTML = "";
    books.forEach((book) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>${book.price ?? "-"}</td>
            <td>${book.publishDate ?? "-"}</td>
            <td>
                <button class="edit-btn" onclick="editBook(${book.id})">수정</button>
                <button class="delete-btn" onclick="deleteBook(${book.id}, '${book.title}')">삭제</button>
            </td>
        `;
        bookTableBody.appendChild(row);
    });
}// renderBookTable

//성공 메시지 출력
function showSuccess(message) {
    formErrorSpan.textContent = message;
    formErrorSpan.style.display = 'block';
    formErrorSpan.style.color = '#28a745';
}
//에러 메시지 출력
function showError(message) {
    formErrorSpan.textContent = message;
    formErrorSpan.style.display = 'block';
    formErrorSpan.style.color = '#dc3545';
}
//메시지 초기화
function clearMessages() {
    formErrorSpan.style.display = 'none';
}