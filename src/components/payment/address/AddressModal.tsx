import { useDaumPostcodePopup } from 'react-daum-postcode';

const DaumPostcodeMobile = () => {
    const open = useDaumPostcodePopup('//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js');

    // 주소 검색이 완료되었을 때 실행될 콜백 함수
    const handleComplete = (data) => {
        let fullAddress = data.address;
        let extraAddress = '';

        // 사용자가 도로명 주소를 선택했을 경우
        if (data.addressType === 'R') {
            if (data.bname !== '') {
                extraAddress += data.bname;
            }
            if (data.buildingName !== '') {
                extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
            }
            fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
        }

        // 받아온 주소 정보를 활용하는 로직
        console.log("선택된 우편번호:", data.zonecode);
        console.log("선택된 전체 주소:", fullAddress);

        // 예: 부모 컴포넌트의 상태를 업데이트하는 함수를 호출
        // onSelectAddress({ postcode: data.zonecode, address: fullAddress });
    };

    const handleClick = () => {
        open({ onComplete: handleComplete });
    };

    return (
        <div>
            <p>모바일에서 주소 검색 팝업을 열어보세요.</p>
            <button onClick={handleClick}>주소 검색</button>
        </div>
    );
};

export default DaumPostcodeMobile;