interface SidebarItem {
  label: string
  path: string
  children?: SidebarItem[]
}

export const sidebarItems: SidebarItem[] = [
  {
    label: '내 정보 수정',
    path: '/mypage/myinfo',
    children: [
      { label: '기본정보', path: '/mypage/myinfo/detail' },
      { label: '비밀번호 변경', path: '/mypage/myinfo/changepassword' },
      // { label: '연결된 계정', path: '/mypage/myinfo/linkedaccount' },
      { label: '배송지 관리', path: '/mypage/myinfo/address' },
      { label: '회원 탈퇴', path: '/mypage/myinfo/withdraw' },
    ],
  },
  {
    label: '내 티켓',
    path: '/mypage/ticket',
    children: [
      { label: '예매 / 취소 내역', path: '/mypage/ticket/history' },
      { label: '양도', path: '/mypage/ticket/transfer' },
      { label: '입장 인원 수 조회', path: '/mypage/ticket/entrancecheck' },
    ],
  },
  {
    label: '북마크',
    path: '/mypage/bookmark',
    children: [
      { label: '관심목록', path: '' },
    ],
  },
]
