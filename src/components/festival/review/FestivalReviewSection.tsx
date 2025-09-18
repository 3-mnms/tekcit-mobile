// src/components/festival/review/FestivalReviewSection.tsx
import React, { useMemo, useState } from 'react'
import styles from './FestivalReviewSection.module.css'
import {
  useFestivalReviews,
  useMyFestivalReview,
  useCreateFestivalReview,
  useDeleteFestivalReview,
  useUpdateFestivalReview,
} from '@/models/festival/tanstack-query/useFestivalReview'
import type { ReviewSort } from '@/models/festival/reviewTypes'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/components/common/button/Button'
import { useTokenInfoQuery } from '@/shared/api/useTokenInfoQuery'
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import Spinner from '@/components/common/spinner/Spinner'

type Props = { fid: string }

const reviewSchema = z.object({
  reviewContent: z
    .string()
    .trim()
    .min(1, '한 글자 이상 입력해 주세요.')
    .max(512, '내용은 512자까지 작성할 수 있어요.'),
})
type ReviewForm = z.infer<typeof reviewSchema>

const FestivalReviewSection: React.FC<Props> = ({ fid }) => {
  const [sort, setSort] = useState<ReviewSort>('desc')
  const [page, setPage] = useState(0)

  const { data, isLoading, isError } = useFestivalReviews(fid, sort, page)
  useMyFestivalReview(fid) // (선택) 내 리뷰 캐시 갱신용
  const createMut = useCreateFestivalReview(fid)
  const deleteMut = useDeleteFestivalReview()

  // 🔧 인라인 수정 상태
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const updateMut = useUpdateFestivalReview(fid, editingId ?? 0) // editingId가 바뀌면 훅 재설정

  // ✅ 서버에서 토큰 파싱해 { userId, role, name } 확보
  const { data: tokenInfo } = useTokenInfoQuery()
  const myUserId = tokenInfo?.userId ?? null
  const isLoggedIn = !!tokenInfo

  // 작성 폼
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<ReviewForm>({ resolver: zodResolver(reviewSchema), mode: 'onChange' })

  const onSubmit = (form: ReviewForm) => {
    createMut.mutate(form, {
      onSuccess: () => {
        reset({ reviewContent: '' })
        alert('기대평이 등록되었어요!')
      },
      onError: (e: any) => {
        const msg =
          e?.response?.data?.errorMessage ??
          e?.response?.data?.message ??
          '등록에 실패했어요. 잠시 후 다시 시도해 주세요.'
        alert(msg)
      },
    })
  }

  const onClickDelete = (rId: number) => {
    if (!confirm('정말 삭제할까요? 삭제 후 되돌릴 수 없어요.')) return
    deleteMut.mutate(
      { fid, rId },
      {
        onSuccess: () => alert('삭제되었습니다.'),
        onError: (e: any) => {
          const msg =
            e?.response?.data?.errorMessage ??
            e?.response?.data?.message ??
            '삭제에 실패했어요. 잠시 후 다시 시도해 주세요.'
          alert(msg)
        },
      },
    )
  }

  // ✏️ 수정 시작(인라인)
  const startInlineEdit = (rId: number, currentText: string) => {
    setEditingId(rId)
    setEditingValue(currentText)
  }
  const cancelInlineEdit = () => {
    setEditingId(null)
    setEditingValue('')
  }

  const canEditSave = useMemo(() => {
    const t = editingValue.trim()
    return t.length >= 1 && t.length <= 512 && !updateMut.isPending
  }, [editingValue, updateMut.isPending])

  const saveInlineEdit = () => {
    if (!editingId) return
    updateMut.mutate(
      { reviewContent: editingValue.trim() },
      {
        onSuccess: () => {
          alert('수정되었습니다.')
          cancelInlineEdit()
        },
        onError: (e: any) => {
          const msg =
            e?.response?.data?.errorMessage ??
            e?.response?.data?.message ??
            '수정에 실패했어요. 잠시 후 다시 시도해 주세요.'
          alert(msg)
        },
      },
    )
  }

  const items = data?.reviews?.content ?? []
  const totalPages = data?.reviews?.totalPages ?? 0
  const analyze = data?.analyze

  const orderedItems = useMemo(() => {
    if (!items.length || myUserId == null) return items
    const mine: typeof items = []
    const others: typeof items = []
    items.forEach((it) =>
      Number(it.userId) === Number(myUserId) ? mine.push(it) : others.push(it),
    )
    return [...mine, ...others]
  }, [items, myUserId])

  const maskUserName = (name: string) => {
    if (!name) return ''
    if (name.length === 1) return name
    if (name.length === 2) return name[0] + '*'
    return name[0] + '*' + name.slice(2)
  }

  return (
    <section className={styles.wrap}>
      <header className={styles.header}>
        <h2 className={styles.title}>AI 기대평</h2>

        <div className={styles.actions}>
          <select
            value={sort}
            onChange={(e) => {
              setPage(0)
              setSort(e.target.value as ReviewSort)
            }}
            className={styles.select}
            aria-label="정렬"
          >
            <option value="desc">최신순</option>
            <option value="asc">오래된순</option>
          </select>
        </div>
      </header>

      {analyze && (
        <div className={styles.analyzeBox}>
          <p className={styles.analyzeContent}>{analyze.analyzeContent}</p>
          <div className={styles.analyzeBars}>
            <div className={styles.bar}>
              <span className={styles.label}>긍정</span>
              <progress value={analyze.positive} max={100}></progress>
              <span className={styles.percent}>{analyze.positive.toFixed(1)}%</span>
            </div>
            <div className={styles.bar}>
              <span className={styles.label}>부정</span>
              <progress value={analyze.negative} max={100}></progress>
              <span className={styles.percent}>{analyze.negative.toFixed(1)}%</span>
            </div>
            <div className={styles.bar}>
              <span className={styles.label}>중립</span>
              <progress value={analyze.neutral} max={100}></progress>
              <span className={styles.percent}>{analyze.neutral.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* 작성 박스 (로그인 시에만) */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.editor}>
          <textarea
            className={styles.textarea}
            placeholder="이 공연에 대한 기대평을 남겨주세요 (최대 512자)"
            {...register('reviewContent')}
          />
          {errors.reviewContent?.message && (
            <p className={styles.error}>{errors.reviewContent.message}</p>
          )}
          <div className={styles.editorFooter}>
            <Button
              type="submit"
              className={styles.submitBtn}
              disabled={!isValid || createMut.isPending}
            >
              {createMut.isPending ? '등록 중...' : '등록'}
            </Button>
          </div>
        </form>
      ) : (
        <div className={styles.loginHint}>로그인 후 기대평을 작성할 수 있어요 😸</div>
      )}

      {/* 목록 */}
      <div className={styles.list}>
        {isLoading && <div className={styles.skeleton}>기대평을 불러오는 중...</div>}
        {isError && (
          <div className={styles.error}>목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>
        )}
        {!isLoading && !isError && orderedItems.length === 0 && (
          <div className={styles.empty}>아직 기대평이 없어요.</div>
        )}

        {orderedItems.map((rev, idx) => {
          const safeKey =
            (rev.reviewId != null ? `rid-${rev.reviewId}` : `u-${rev.userId}-t-${rev.createdAt}`) +
            `#${idx}`

          const isMine = myUserId != null && Number(myUserId) === Number(rev.userId)
          const isEditingThis = editingId != null && rev.reviewId === editingId

          const created = new Date(rev.createdAt)
          const updated = rev.updatedAt ? new Date(rev.updatedAt) : null
          const isEdited = !!(updated && updated.getTime() !== created.getTime())
          const displayTime = isEdited && updated ? updated : created

          return (
            <article key={safeKey} className={styles.item}>
              <div className={styles.meta}>
                <div className={styles.leftMeta}>
                  <div className={styles.avatar} aria-hidden />
                  <div className={styles.metaText}>
                    <span className={styles.user}>{maskUserName(rev.userName)}</span>
                    <span className={styles.dot}>·</span>
                    <time className={styles.time}>{displayTime.toLocaleString()}</time>
                    {isEdited && <span className={styles.editedBadge}>수정됨</span>}
                  </div>
                </div>

                {isMine && !isEditingThis && rev.reviewId != null && (
                  <div className={styles.actionsInline}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => startInlineEdit(rev.reviewId!, rev.reviewContent)}
                      title="기대평 수정"
                      aria-label="기대평 수정"
                    >
                      <FiEdit2 />
                    </button>
                    <span className={styles.sep} aria-hidden="true"></span>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.danger}`}
                      onClick={() => onClickDelete(rev.reviewId!)}
                      disabled={deleteMut.isPending}
                      title="기대평 삭제"
                      aria-label="기대평 삭제"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                )}
              </div>

              {/* 보기/편집 토글 */}
              {isEditingThis ? (
                <div className={styles.inlineEditor}>
                  <textarea
                    className={styles.textarea}
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    placeholder="내용을 수정하세요 (최대 512자)"
                  />
                  <div className={styles.editorFooter}>
                    <button
                      type="button"
                      className={styles.modalCancel}
                      onClick={cancelInlineEdit}
                      disabled={updateMut.isPending}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className={styles.modalSave}
                      onClick={saveInlineEdit}
                      disabled={!canEditSave}
                    >
                      {updateMut.isPending ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className={styles.content}>{rev.reviewContent}</p>
              )}
            </article>
          )
        })}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <nav className={styles.pager} aria-label="pagination">
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            이전
          </button>
          <span className={styles.pageInfo}>
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            다음
          </button>
        </nav>
      )}
    </section>
  )
}

export default FestivalReviewSection
