// components/festival/detail/FestivalInfoDetailSection.tsx
import React from 'react';
import styles from './FestivalInfoDetailSection.module.css';
import { FaRegGrinStars } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { useFestivalDetail } from '@/models/festival/tanstack-query/useFestivalDetail';
import Spinner from '@/components/common/spinner/Spinner'

const FestivalInfoDetailSection: React.FC = () => {
  const { fid } = useParams<{ fid: string }>();
  const { data: detail, isLoading, isError } = useFestivalDetail(fid ?? '');

  let body: React.ReactNode = null;

  if (!fid) {
    body = <p className={styles.description}>잘못된 경로입니다.</p>;
  } else if (isLoading) {
    <Spinner />
  } else if (isError || !detail) {
    body = <p className={styles.description}>공연 정보를 불러오지 못했어요 ㅠㅠ</p>;
  } else {
    const story = detail.story?.trim();
    const images =
      detail.contentFiles?.map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter((s) => s.length > 0) ?? [];

    body = (
      <>
        <p className={styles.description}>
          {story && story.length > 0 ? story : ''}
        </p>

        {/* 이미지가 있을 때만 렌더 */}
        {images.length > 0 && (
          <div className={styles.images}>
            {images.map((src, idx) => (
              <figure className={styles.imageItem} key={`${src}-${idx}`}>
                <img
                  className={styles.image}
                  src={src}
                  alt={`공연 상세 이미지 ${idx + 1}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </figure>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <section className={styles.container}>
      <h3 className={styles.title}>
        <FaRegGrinStars className={styles.icon} />
        공연 정보 상세 내용
      </h3>
      {body}
    </section>
  );
};

export default FestivalInfoDetailSection;
