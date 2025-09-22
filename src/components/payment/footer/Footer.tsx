import React from 'react';
import styles from './Footer.module.css';

interface FooterProps {
  className?: string;
}

const teamRow1 = [
  { name: '박효영', role: 'PO' },
  { name: '이무현', role: '조장' },
  { name: '정재운', role: '백엔드 리더' },
  { name: '안희윤', role: '프론트 리더' },
  { name: '이도건', role: '데브옵스 리더' },
];

const teamRow2 = [
  { name: '권희수', role: '스크럼 마스터' },
  { name: '김연주', role: '백엔드 팀원' },
  { name: '김민정', role: '프론트 팀원' },
  { name: '정혜영', role: '프론트 팀원' },
  { name: '이종원', role: '데브옵스 팀원' },
];

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={`${styles.footer} ${className ?? ''}`} role="contentinfo">
      <div className={styles.inner}>
        <section className={styles.col} aria-labelledby="footer-company">
          <h3 id="footer-company" className={styles.head}>
            테킷
          </h3>
          <p className={styles.text}>Festival Ticketing Service "Tekcit"</p>
          <p className={styles.copy}>© 2025 Tekcit Project. All rights reserved.</p>
        </section>
        
      </div>
    </footer>
  );
};

export default Footer;
